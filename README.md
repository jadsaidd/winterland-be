# Winter Land Backend

A dual-platform Node.js/TypeScript backend serving Mobile and Dashboard applications with distinct authentication flows and permissions management.

## Features

- **Dual Platform Support**: Separate authentication and permission systems for Mobile and Dashboard
- **Mobile Authentication**: OTP-based passwordless auth with Google/Apple social login
- **Dashboard Authentication**: OTP-only passwordless auth with RBAC and granular permissions
- **Repository Pattern**: Clean separation of concerns with organized data access layer
- **Pagination**: Standardized pagination across all list endpoints
- **i18n Support**: Multi-language support (English & Arabic)
- **Error Handling**: Typed exception handling with consistent error responses
- **Rate Limiting**: Built-in rate limiting for authentication endpoints
- **Activity Logging**: Automatic activity log tracking for all requests

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schemas
- **Logging**: Winston logger
- **Server**: Express.js

## Project Structure

```bash
src/
├── routes/[platform]/       # Platform-specific routes
├── controllers/[platform]/  # Platform-specific controllers
├── services/               # Shared business logic
├── repositories/           # Database access layer
├── middleware/             # Reusable middleware
├── schemas/               # Zod validation schemas
├── config/                # Configuration management
├── dtos/                  # Request/response types
└── utils/                 # Helper functions
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- PostgreSQL

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm prisma:migrate

# Seed the database
pnpm seed
```

### Development

```bash
# Start development server with hot reload
pnpm dev

# Open database GUI
pnpm prisma:studio

# Run TypeScript type checking
pnpm type-check

# Fix ESLint issues
pnpm lint:fix
```

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 8000)
- `JWT_ACCESS_SECRET` - Access token signing key
- `JWT_REFRESH_SECRET` - Refresh token signing key
- `DATABASE_URL` - PostgreSQL connection string

## API Endpoints

### Mobile API

- Base path: `/api/v1/mobile`
- OTP-based passwordless authentication
- Auto-user registration on first login
- Social login support (Google, Apple)

### Dashboard API

- Base path: `/api/v1/dashboard`
- OTP-only authentication for existing users
- Role-based access control (RBAC)
- Permission-based endpoint access

## Core Patterns

### Repository Pattern

All database operations go through repository classes. Never use Prisma directly in services/controllers.

### Three-Layer Request Flow

```text
Route → Controller → Service → Repository
```

### Permission System

Format: `resource:action` (e.g., `users:create`, `roles:read`)

Permissions are enforced on dashboard routes via middleware.

### Validation

All requests are validated using Zod schemas with a centralized validation middleware.

## Database Seeding

Seeders are idempotent and safe to re-run:

```bash
pnpm seed                   # Run all seeders
pnpm seed:permissions       # Seed permissions only
```

Seed order: permissions → roles → country codes → users
