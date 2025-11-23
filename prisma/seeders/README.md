# Database Seeders

This directory contains database seeders for the Winter Land backend application.

## 📁 Structure

```bash
prisma/
├── seed.ts                           # Main seed file (runs all seeders)
└── seeders/
    ├── permissions.seed.ts           # Seeds all permissions
    ├── roles.seed.ts                 # Seeds roles with permissions
    ├── country-codes.seed.ts         # Seeds country codes with flags
    ├── payment-methods.seed.ts       # Seeds payment methods with media
    └── users.seed.ts                 # Seeds users with roles
```

## 🎯 Seeded Data

### Permissions

All permissions from dashboard routes:

- **Permissions**: `create`, `read`, `update`, `delete`, `assign`, `revoke`
- **Roles**: `create`, `read`, `update`, `delete`, `assign`, `revoke`
- **Users**: `create`, `read`, `update`, `delete`
- **Country Codes**: `create`, `read`, `update`, `delete`
- **Activity Logs**: `read`

### Roles

- **IT**: Full system access with all permissions
- **Admin**: Limited access (read-only for permissions/roles, full access for users/country-codes)
- **Customer**: No administrative permissions

### Country Codes

- **United Arab Emirates**: +971, AE, 9 digits
- **Lebanon**: +961, LB, 8 digits

### Payment Methods

- **Cash**: Traditional cash payment with icon
- **Ziina**: Electronic payment method with icon

### Categories

15 diverse categories with bilingual content (en/ar):

- **Winter Sports**: Skiing, snowboarding, ice skating
- **Ice Adventures**: Frozen landscape explorations
- **Snow Activities**: Snowman building, snow fights
- **Family Entertainment**: Family-friendly activities
- **Adventure Park**: Outdoor activities and challenges
- **Kids Zone**: Safe supervised children's activities
- **Arctic Experience**: Snow houses, ice sculptures
- **Food & Beverages**: Delicious food and warm drinks
- **Photography Spots**: Stunning winter backdrops
- **Ice Skating**: Professional rink with rentals
- **Winter Wonderland**: Magical festive atmosphere
- **Sledding & Tubing**: Thrilling snow adventures
- **Gift Shop**: Winter-themed merchandise
- **VIP Lounges**: Premium amenities and services
- **Special Events**: Seasonal shows and performances

Each category includes 2 media images linked through the pivot table.

## 🚀 Usage

### Run All Seeders

```bash
pnpm seed
```

or

```bash
pnpm prisma:db:seed
```

### Run Individual Seeders

Run specific seeders independently when needed:

```bash
# Seed permissions only
pnpm seed:permissions

# Seed roles only (requires permissions to be seeded first)
pnpm seed:roles

# Seed country codes only
pnpm seed:country-codes

# Seed payment methods only
pnpm seed:payment-methods

# Seed users only (requires roles and country codes to be seeded first)
pnpm seed:users

# Seed categories only
pnpm seed:categories
```

## 📝 Important Notes

### Dependencies Order

The seeders have dependencies and should be run in this order:

1. **Permissions** (no dependencies)
2. **Roles** (depends on permissions)
3. **Country Codes** (no dependencies)
4. **Payment Methods** (no dependencies)
5. **Users** (depends on roles and country codes)
6. **Categories** (no dependencies)
7. **Events** (depends on categories and locations)

The main `seed.ts` file automatically runs them in the correct order.

### Idempotency

All seeders are **idempotent** and can be run multiple times safely. They use `upsert` operations to:

- Create new records if they don't exist
- Update existing records if they already exist
- Avoid duplicate entries

This means you can:

- Re-run seeders after data modifications
- Add new data to existing seeders
- Run seeders in development and staging environments repeatedly

### After Database Reset

After running `pnpm prisma:migrate:reset`, the seeders will automatically run due to the Prisma configuration in `package.json`.

## 🔧 Customization

### Adding New Data

Each seeder file has a data array at the top that you can modify:

```typescript
// permissions.seed.ts
export const permissionsData: PermissionData[] = [
  { name: 'new-resource:create', resource: 'new-resource', action: 'create' },
  // Add more...
];

// roles.seed.ts
export const rolesData: RoleData[] = [
  {
    name: 'NewRole',
    description: 'Description',
    permissions: ['permission:action'],
  },
];

// country-codes.seed.ts
export const countryCodesData: CountryCodeData[] = [
  {
    country: 'Country Name',
    code: '+XXX',
    isoCode: 'XX',
    digits: 10,
    flagUrl: 'https://...',
    active: true,
  },
];

// payment-methods.seed.ts
export const paymentMethodsData: PaymentMethodData[] = [
  {
    name: {
      en: 'Payment Method Name',
      ar: 'اسم طريقة الدفع',
    },
    description: {
      en: 'Description',
      ar: 'الوصف',
    },
    isActive: true,
    mediaUrl: 'https://...',
    mediaType: 'IMAGE',
  },
];

// users.seed.ts
export const usersData: UserData[] = [
  {
    email: 'user@example.com',
    phoneNumber: '1234567890',
    name: 'User Name',
    countryCode: '+961',
    platform: 'Dashboard',
    isVerified: true,
    isEmailVerified: true,
    isPhoneVerified: true,
    status: 'ACTIVE',
    roles: ['RoleName'],
  },
];
```

### Creating New Seeders

1. Create a new file in `prisma/seeders/` (e.g., `new-entity.seed.ts`)
2. Follow the pattern from existing seeders:

   ```typescript
   import { PrismaClient } from '@prisma/client';
   
   const prisma = new PrismaClient();
   
   export async function seedNewEntity() {
     // Seeding logic with upsert
   }
   
   if (require.main === module) {
     seedNewEntity()
       .then(() => process.exit(0))
       .catch((error) => {
         console.error(error);
         process.exit(1);
       })
       .finally(async () => {
         await prisma.$disconnect();
       });
   }
   ```

3. Import and call it in `prisma/seed.ts`
4. Add a script to `package.json`:

   ```json
   "seed:new-entity": "ts-node prisma/seeders/new-entity.seed.ts"
   ```

## 🐛 Troubleshooting

### Issue: "Country code not found"

**Solution**: Make sure to run `pnpm seed:country-codes` before running `pnpm seed:users`

### Issue: "Permission not found"

**Solution**: Make sure to run `pnpm seed:permissions` before running `pnpm seed:roles`

## 📚 Additional Commands

```bash
# View seeded data in Prisma Studio
pnpm prisma:studio

# Reset database and re-run all seeders
pnpm prisma:migrate:reset

# Generate Prisma Client after schema changes
pnpm prisma:generate
```
