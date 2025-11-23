import { PrismaClient } from '@prisma/client';

import { seedCategories } from './seeders/categories.seed';
import { seedCountryCodes } from './seeders/country-codes.seed';
import { seedEvents } from './seeders/events.seed';
import { seedPaymentMethods } from './seeders/payment-methods.seed';
import { seedPermissions } from './seeders/permissions.seed';
import { seedRoles } from './seeders/roles.seed';
import { seedUsers } from './seeders/users.seed';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...\n');

    try {
        // Seed in order (permissions → roles → country codes → users)
        // This order is important due to dependencies

        // 1. Seed Permissions (no dependencies)
        await seedPermissions();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        // 2. Seed Roles (depends on permissions)
        await seedRoles();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        // 3. Seed Country Codes (no dependencies)
        await seedCountryCodes();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        // 4. Seed Payment Methods (no dependencies)
        await seedPaymentMethods();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        // 5. Seed Users (depends on roles and country codes)
        await seedUsers();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        // 6. Seed Categories (no dependencies)
        await seedCategories();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        // 7. Seed Events (depends on categories and locations)
        await seedEvents();
        console.log('-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-');

        console.log('All seeding completed successfully!');
    } catch (error) {
        console.error('Seeding failed:', error);
        throw error;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
