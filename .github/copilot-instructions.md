# Winter Land Backend APIs - AI Coding Agent Instructions

## Architecture Overview

This is a **dual-platform Node.js/TypeScript backend** serving both **Mobile** and **Dashboard** applications with distinct authentication flows and permissions.

### Platform Separation
- **Mobile** (`/api/v1/mobile`): OTP-based passwordless auth + social login (Google/Apple). New users auto-register.
- **Dashboard** (`/api/v1/dashboard`): OTP-only passwordless auth for **existing users only**. RBAC with granular permissions.

**Critical**: Routes are prefixed by platform in `src/routes/index.ts`. Dashboard routes enforce role/permission checks; mobile routes do not.

## Core Patterns

### 1. Repository Pattern
All database access goes through repository classes (`src/repositories/*.repository.ts`). Never call `prisma` directly in services/controllers.

```typescript
// ✅ Correct
const user = await userRepository.findById(id);

// ❌ Wrong
const user = await prisma.user.findUnique({ where: { id } });
```

### 2. Three-Layer Request Flow
**Route → Controller → Service → Repository**

- **Routes**: Define middleware chain (auth → validation → permission → controller)
- **Controllers**: Handle HTTP concerns (req/res), delegate to services
- **Services**: Business logic, orchestrate repositories
- **Repositories**: Database operations only

Example: `src/routes/dashboard/permission.routes.ts` → `DashboardPermissionController` → `PermissionService` → `PermissionRepository`

### 3. Permission System (Dashboard Only)
Format: `resource:action` (e.g., `users:create`, `roles:read`)

```typescript
// Apply to routes using permissionMiddleware
authMiddleware,
permissionMiddleware(['permissions:create']),
```

Permissions are extracted in `authMiddleware` from `User → UserRole → Role → RolePermission → Permission` chain.

### 4. Validation with Zod
All request validation uses Zod schemas (`src/schemas/*.schema.ts`) with the `validate()` middleware:

```typescript
validate(createPermissionSchema),        // validates body
validate(permissionIdParamSchema, 'params'), // validates params
```

### 5. Pagination
All list endpoints use standardized pagination with utility functions from `src/utils/pagination.util.ts`.

**Middleware**: Apply `paginationMiddleware(defaultLimit, maxLimit)` to routes that return lists.

```typescript
// In routes file
router.get(
  '/',
  authMiddleware,
  paginationMiddleware(10, 100), // default: 10, max: 100
  controller.getAll
);
```

**Accessing Pagination in Controllers**: The middleware adds parsed params to `req.pagination`:

```typescript
// In controller
const { page, limit, skip } = (req as any).pagination;
```

**Repository Implementation**: Use `createPaginatedResponse()` helper:

```typescript
// In repository
import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';

async getAllItems(page: number, limit: number): Promise<PaginatedResponse<Item>> {
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    prisma.item.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.item.count(),
  ]);

  return createPaginatedResponse(items, total, page, limit);
}
```

**Response Format**: All paginated responses include `data` array and `pagination` metadata:

```json
{
  "data": [...],
  "pagination": {
    "totalItems": 50,
    "totalPages": 5,
    "currentPage": 1,
    "pageSize": 10,
    "hasNext": true,
    "hasPrevious": false,
    "nextPage": 2,
    "previousPage": null
  }
}
```

**Query Parameters**: Clients pass `?page=1&limit=10` in the URL. The middleware validates and normalizes these values.

### 6. Custom Error Handling
Use typed exceptions from `src/exceptions/http.exception.ts`:
- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `ConflictException` (409)

All errors are caught by `errorMiddleware` which formats responses consistently.

## Environment Configuration

### Adding New Environment Variables
**Critical 3-step process** - never skip steps:

1. **Add to `.env` file** with descriptive comments
2. **Add to `Config` interface** in `src/config/env.config.ts`
3. **Add to `config` object** in `src/config/env.config.ts`

```typescript
// Example: Adding a new email service config
// Step 1: In .env
EMAIL_SERVICE_API_KEY=your-key-here

// Step 2 & 3: In src/config/env.config.ts
interface Config {
  // ... existing fields
  EMAIL_SERVICE_API_KEY: string;
}

const config: Config = {
  // ... existing fields
  EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY!,
};
```

**Always import config from `src/config`**, never use `process.env` directly in application code:
```typescript
// ✅ Correct
import { config } from '../config';
const apiKey = config.EMAIL_SERVICE_API_KEY;

// ❌ Wrong
const apiKey = process.env.EMAIL_SERVICE_API_KEY;
```

### Required Environment Variables
Enforced at startup in `env.config.ts`:
- `PORT` - Server port (default: 8000)
- `JWT_ACCESS_SECRET` - Access token signing key
- `JWT_REFRESH_SECRET` - Refresh token signing key
- `DATABASE_URL` - Prisma database connection

## Key Development Commands

```bash
# Development
pnpm dev                    # Start with nodemon hot-reload

# Database (Prisma)
pnpm prisma:studio          # Open database GUI
pnpm prisma:migrate         # Create new migration
pnpm prisma:generate        # Regenerate Prisma Client after schema changes
pnpm seed                   # Run all seeders (idempotent)
pnpm seed:permissions       # Seed specific data (order: permissions → roles → country-codes → users)

# Code Quality
pnpm lint:fix               # Auto-fix ESLint issues
pnpm type-check             # TypeScript validation without build
```

## Database Conventions

### Prisma Schema (`prisma/schema.prisma`)
- Models use PascalCase (`User`, `CountryCode`)
- Table names use snake_case via `@@map("users")`
- IDs are always CUIDs (`@default(cuid())`)
- Soft deletes use `UserStatus.DELETED` (not actual deletion)
- Activity logging is automatic via `authMiddleware` (creates `ActivityLog` entries)

### Seeders are Idempotent
All seeders use `upsert` operations. Safe to re-run after resets or in any environment.

## Authentication Differences

| Aspect | Mobile | Dashboard |
|--------|--------|-----------|
| New Users | Auto-create on login | Must be created by admin |
| Auth Methods | OTP + Google + Apple | OTP only |
| Response Field | `isNewUser: boolean` | No `isNewUser` field |
| Permissions | None | RBAC enforced |
| Platform Value | `UserPlatform.Mobile` | `UserPlatform.Dashboard` |

**JWT Flow**: Both platforms use access tokens (short-lived) + refresh tokens (long-lived) stored in `RefreshToken` table.

## Common Integration Points

### Rate Limiting
- Configured per-route in `src/rate-limiter/[platform]/auth.rate-limiter.ts`
- General limiter applied globally in `src/app.ts`
- OTP requests: 5/15min, Verification: 10/15min

### Logging
- Winston logger configured in `src/config/logger.config.ts`
- Automatic HTTP logging via Morgan
- Activity logs stored in database via `ActivityLog` model

### Prisma Client Singleton
Import from `src/utils/prisma.client.ts` (includes Accelerate extension). Never instantiate `new PrismaClient()` elsewhere.

### Internationalization (i18n)
The application supports **English (en)** and **Arabic (ar)** with utilities in `src/utils/i18n.util.ts`.

**Language Selection Priority**:
1. `lang` header in request (e.g., `lang: ar`)
2. Authenticated user's `selectedLanguage` field
3. Default: English (`en`)

### Currency
The application uses **AED (United Arab Emirates Dirham)** as the default currency for all monetary values and transactions.

**Storing Multilingual Data**:
- Use JSON fields in Prisma schema for i18n content:
```prisma
model Category {
  id          String   @id @default(cuid())
  name        Json     // { "en": "Electronics", "ar": "الإلكترونيات" }
  description Json?    // { "en": "...", "ar": "..." }
}
```

**Retrieving Localized Data**:
```typescript
import { getPreferredLanguage, localizeObject, localizeArray } from '../utils/i18n.util';

// In controller/service
const language = getPreferredLanguage(req);

// Single object
const localizedCategory = localizeObject(
  category,
  ['name', 'description'], // fields to localize
  language
);

// Array of objects
const localizedCategories = localizeArray(
  categories,
  ['name', 'description'],
  language
);
```

**Validation**:
Use `validateI18nObject()` to ensure required languages are present:
```typescript
import { validateI18nObject } from '../utils/i18n.util';

// Validate English is provided (minimum requirement)
if (!validateI18nObject(nameJson, ['en'])) {
  throw new BadRequestException('English translation is required');
}
```

**Key Functions**:
- `getPreferredLanguage(req)` - Extract language from request
- `localizeField(jsonObj, lang)` - Convert single JSON field to string
- `localizeObject(obj, fields, lang)` - Localize multiple fields in object
- `localizeArray(arr, fields, lang)` - Localize multiple objects
- `validateI18nObject(obj, requiredLangs)` - Validate i18n structure

**Best Practices**:
- Always validate that at least English (`en`) is provided in i18n fields
- Apply localization in services/controllers before returning responses
- Store all user-facing text (names, descriptions, titles) as JSON i18n fields
- Falls back to English if requested language is missing

## When Adding New Features

1. **New Resource**: Create migration → Update schema → Generate Prisma Client → Create repository → Service → Controller → Routes
2. **New Permission**: Add to `prisma/seeders/permissions.seed.ts` → Run seed → Apply to routes via `permissionMiddleware`
3. **New Validation**: Create Zod schema in `src/schemas/` → Apply with `validate()` middleware
4. **Cross-Platform Feature**: Consider if it needs separate Mobile/Dashboard implementations with different auth rules

## File Organization

```
src/
├── routes/[platform]/      # Platform-specific routes
├── controllers/[platform]/ # Platform-specific controllers
├── services/              # Shared business logic
├── repositories/          # Shared database access
├── middleware/            # Reusable middleware
├── schemas/              # Zod validation schemas
├── dtos/                 # Request/response types
└── utils/                # Helper functions (token, OTP, pagination)
```

Platform-specific code goes in `mobile/` or `dashboard/` subdirectories. Shared code stays at top level.

## Testing & Debugging

- Check logs in `logs/` directory
- Use `pnpm prisma:studio` to inspect database state
- Verify permissions in seeders: `prisma/seeders/README.md`
- API docs available in `docs/MOBILE_AUTH_API.md` and `docs/DASHBOARD_AUTH_API.md`

## Code Style Notes

- Use `async/await` (never callbacks)
- Controllers catch errors and pass to `next(error)`
- Services throw typed exceptions (repository errors bubble up)
- All timestamps are `DateTime` (Prisma handles timezone conversion)
- Use `logger` from config, never `console.log`
