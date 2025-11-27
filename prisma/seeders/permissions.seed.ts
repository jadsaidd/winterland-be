import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PermissionData {
    name: string;
    resource: string;
    action: string;
}

export const permissionsData: PermissionData[] = [
    // Permissions
    { name: 'permissions:create', resource: 'permissions', action: 'create' },
    { name: 'permissions:read', resource: 'permissions', action: 'read' },
    { name: 'permissions:update', resource: 'permissions', action: 'update' },
    { name: 'permissions:delete', resource: 'permissions', action: 'delete' },
    { name: 'permissions:assign', resource: 'permissions', action: 'assign' },
    { name: 'permissions:revoke', resource: 'permissions', action: 'revoke' },

    // Roles
    { name: 'roles:create', resource: 'roles', action: 'create' },
    { name: 'roles:read', resource: 'roles', action: 'read' },
    { name: 'roles:update', resource: 'roles', action: 'update' },
    { name: 'roles:delete', resource: 'roles', action: 'delete' },
    { name: 'roles:assign', resource: 'roles', action: 'assign' },
    { name: 'roles:revoke', resource: 'roles', action: 'revoke' },

    // Users
    { name: 'users:create', resource: 'users', action: 'create' },
    { name: 'users:read', resource: 'users', action: 'read' },
    { name: 'users:update', resource: 'users', action: 'update' },
    { name: 'users:delete', resource: 'users', action: 'delete' },

    // Country Codes
    { name: 'country-codes:create', resource: 'country-codes', action: 'create' },
    { name: 'country-codes:read', resource: 'country-codes', action: 'read' },
    { name: 'country-codes:update', resource: 'country-codes', action: 'update' },
    { name: 'country-codes:delete', resource: 'country-codes', action: 'delete' },

    // Application Features
    { name: 'application-features:create', resource: 'application-features', action: 'create' },
    { name: 'application-features:read', resource: 'application-features', action: 'read' },
    { name: 'application-features:update', resource: 'application-features', action: 'update' },
    { name: 'application-features:delete', resource: 'application-features', action: 'delete' },

    // Categories
    { name: 'categories:create', resource: 'categories', action: 'create' },
    { name: 'categories:read', resource: 'categories', action: 'read' },
    { name: 'categories:update', resource: 'categories', action: 'update' },
    { name: 'categories:delete', resource: 'categories', action: 'delete' },
    { name: 'categories:toggle-active', resource: 'categories', action: 'toggle-active' },

    // Locations
    { name: 'locations:create', resource: 'locations', action: 'create' },
    { name: 'locations:read', resource: 'locations', action: 'read' },
    { name: 'locations:update', resource: 'locations', action: 'update' },
    { name: 'locations:delete', resource: 'locations', action: 'delete' },
    { name: 'locations:toggle-active', resource: 'locations', action: 'toggle-active' },

    // Events
    { name: 'events:create', resource: 'events', action: 'create' },
    { name: 'events:read', resource: 'events', action: 'read' },
    { name: 'events:update', resource: 'events', action: 'update' },
    { name: 'events:delete', resource: 'events', action: 'delete' },
    { name: 'events:toggle-active', resource: 'events', action: 'toggle-active' },

    // Schedules
    { name: 'schedules:create', resource: 'schedules', action: 'create' },
    { name: 'schedules:read', resource: 'schedules', action: 'read' },
    { name: 'schedules:update', resource: 'schedules', action: 'update' },
    { name: 'schedules:delete', resource: 'schedules', action: 'delete' },

    // Schedule Workers
    { name: 'schedule-workers:create', resource: 'schedule-workers', action: 'create' },
    { name: 'schedule-workers:read', resource: 'schedule-workers', action: 'read' },
    { name: 'schedule-workers:delete', resource: 'schedule-workers', action: 'delete' },

    // Payment Methods
    { name: 'payment-methods:create', resource: 'payment-methods', action: 'create' },
    { name: 'payment-methods:read', resource: 'payment-methods', action: 'read' },
    { name: 'payment-methods:update', resource: 'payment-methods', action: 'update' },
    { name: 'payment-methods:delete', resource: 'payment-methods', action: 'delete' },
    { name: 'payment-methods:toggle-active', resource: 'payment-methods', action: 'toggle-active' },

    // Support Tickets
    { name: 'support-tickets:read', resource: 'support-tickets', action: 'read' },
    { name: 'support-tickets:update', resource: 'support-tickets', action: 'update' },
    { name: 'support-tickets:delete', resource: 'support-tickets', action: 'delete' },

    // Activity Logs
    { name: 'activity_logs:read', resource: 'activity_logs', action: 'read' },
];

export async function seedPermissions() {
    console.log('Seeding permissions...');

    try {
        // Use upsert to avoid duplicates and allow re-running
        for (const permission of permissionsData) {
            await prisma.permission.upsert({
                where: { name: permission.name },
                update: {
                    resource: permission.resource,
                    action: permission.action,
                },
                create: permission,
            });
        }

        console.log(`Successfully seeded ${permissionsData.length} permissions`);
        return await prisma.permission.findMany();
    } catch (error) {
        console.error('Error seeding permissions:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedPermissions()
        .then(() => {
            console.log('Permissions seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Permissions seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
