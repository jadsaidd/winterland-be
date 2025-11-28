import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RoleData {
    name: string;
    roleType: 'WORKER' | 'CUSTOMER';
    description: string;
    permissions: string[]; // Permission names
}

export const rolesData: RoleData[] = [
    {
        name: 'IT',
        roleType: 'WORKER',
        description: 'IT role with full system access and all permissions',
        permissions: [
            // All permissions
            'permissions:create',
            'permissions:read',
            'permissions:update',
            'permissions:delete',
            'permissions:assign',
            'permissions:revoke',
            'roles:create',
            'roles:read',
            'roles:update',
            'roles:delete',
            'roles:assign',
            'roles:revoke',
            'users:create',
            'users:read',
            'users:update',
            'users:delete',
            'country-codes:create',
            'country-codes:read',
            'country-codes:update',
            'country-codes:delete',
            'application-features:create',
            'application-features:read',
            'application-features:update',
            'application-features:delete',
            'activity_logs:read',
            'categories:create',
            'categories:read',
            'categories:update',
            'categories:delete',
            'categories:toggle-active',
            'locations:create',
            'locations:read',
            'locations:update',
            'locations:delete',
            'locations:toggle-active',
            'events:create',
            'events:read',
            'events:update',
            'events:delete',
            'events:toggle-active',
            'schedules:create',
            'schedules:read',
            'schedules:update',
            'schedules:delete',
            'schedule-workers:create',
            'schedule-workers:read',
            'schedule-workers:delete',
            'payment-methods:create',
            'payment-methods:read',
            'payment-methods:update',
            'payment-methods:delete',
            'payment-methods:toggle-active',
            'support-tickets:read',
            'support-tickets:update',
            'support-tickets:delete',
            // Bookings
            'bookings:create',
            'bookings:read',
            'bookings:update',
            'bookings:delete',
        ],
    },
    {
        name: 'Admin',
        roleType: 'WORKER',
        description: 'Admin role with limited permissions',
        permissions: [
            // Permissions: read only
            'permissions:read',
            // Roles: read only
            'roles:read',
            // Users: full access
            'users:create',
            'users:read',
            'users:update',
            'users:delete',
            // Country Codes: full access
            'country-codes:create',
            'country-codes:read',
            'country-codes:update',
            'country-codes:delete',
            // Application Features: full access
            'application-features:create',
            'application-features:read',
            'application-features:update',
            'application-features:delete',
            // Activity Logs: read only
            'activity_logs:read',
        ],
    },
    {
        name: 'Worker',
        roleType: 'WORKER',
        description: 'Worker role with common operational permissions (limited compared to IT)',
        permissions: [
            // Limited subset of IT permissions
            'permissions:read',
            'roles:read',

            // Users: can create, read, update but not delete
            'users:create',
            'users:read',
            'users:update',

            // Country Codes: read and update
            'country-codes:read',
            'country-codes:update',

            // Application Features: read and update
            'application-features:read',
            'application-features:update',

            // Activity Logs: read
            'activity_logs:read',

            // Categories: create/read/update
            'categories:create',
            'categories:read',
            'categories:update',

            // Locations: create/read/update
            'locations:create',
            'locations:read',
            'locations:update',

            // Events: create/read/update
            'events:create',
            'events:read',
            'events:update',

            // Schedules: create/read/update
            'schedules:create',
            'schedules:read',
            'schedules:update',

            // Schedule Workers: create/read
            'schedule-workers:create',
            'schedule-workers:read',
        ],
    },
    {
        name: 'Customer',
        roleType: 'CUSTOMER',
        description: 'Customer role with no administrative permissions',
        permissions: [],
    },
];

export async function seedRoles() {
    console.log('Seeding roles...');

    try {
        const createdRoles = [];

        for (const roleData of rolesData) {
            // Upsert role
            const role = await prisma.role.upsert({
                where: { name: roleData.name },
                update: {
                    roleType: roleData.roleType,
                    description: roleData.description,
                },
                create: {
                    name: roleData.name,
                    roleType: roleData.roleType,
                    description: roleData.description,
                },
            });

            // Get permissions by name
            const permissions = await prisma.permission.findMany({
                where: {
                    name: {
                        in: roleData.permissions,
                    },
                },
            });

            // Delete existing role permissions for this role
            await prisma.rolePermission.deleteMany({
                where: { roleId: role.id },
            });

            // Create new role permissions
            if (permissions.length > 0) {
                await prisma.rolePermission.createMany({
                    data: permissions.map((permission) => ({
                        roleId: role.id,
                        permissionId: permission.id,
                    })),
                    skipDuplicates: true,
                });
            }

            createdRoles.push(role);
            console.log(`Role "${role.name}" seeded with ${permissions.length} permissions`);
        }

        console.log(`Successfully seeded ${createdRoles.length} roles`);
        return createdRoles;
    } catch (error) {
        console.error('Error seeding roles:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedRoles()
        .then(() => {
            console.log('Roles seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Roles seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
