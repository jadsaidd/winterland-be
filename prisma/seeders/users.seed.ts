import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserData {
    email?: string;
    phoneNumber?: string;
    name: string;
    countryCode?: string; // Country code like '+961'
    platform: 'Mobile' | 'Dashboard';
    isVerified: boolean;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    roles: string[]; // Role names
    isTestUser?: boolean;
}

export const usersData: UserData[] = [
    {
        email: 'admin@winterland-alain.ae',
        name: 'Winterland Admin',
        platform: 'Dashboard',
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: 'ACTIVE',
        roles: ['IT', 'Worker'],
        isTestUser: true,
    },
    {
        email: 'worker@example.com',
        phoneNumber: '70000001',
        name: 'Worker User',
        countryCode: '+961',
        platform: 'Dashboard',
        isVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: 'ACTIVE',
        roles: ['Worker'],
        isTestUser: true,
    },
];

export async function seedUsers() {
    console.log('Seeding users...');

    try {
        const createdUsers = [];

        for (const userData of usersData) {
            // Get the country code if provided
            let countryCodeId: string | undefined = undefined;

            if (userData.countryCode) {
                const countryCode = await prisma.countryCode.findUnique({
                    where: { code: userData.countryCode },
                });

                if (!countryCode) {
                    console.warn(`Country code ${userData.countryCode} not found, skipping user ${userData.email || userData.phoneNumber}`);
                    continue;
                }
                countryCodeId = countryCode.id;
            }

            // Upsert user (by email or phone)
            const whereClause = userData.email
                ? { email: userData.email }
                : { phoneNumber: userData.phoneNumber };

            const user = await prisma.user.upsert({
                where: whereClause,
                update: {
                    name: userData.name,
                    phoneNumber: userData.phoneNumber,
                    email: userData.email,
                    countryCodeId: countryCodeId,
                    platform: userData.platform,
                    isVerified: userData.isVerified,
                    isEmailVerified: userData.isEmailVerified,
                    isPhoneVerified: userData.isPhoneVerified,
                    status: userData.status,
                    isTestUser: userData.isTestUser || true,
                },
                create: {
                    email: userData.email,
                    phoneNumber: userData.phoneNumber,
                    name: userData.name,
                    countryCodeId: countryCodeId,
                    platform: userData.platform,
                    isVerified: userData.isVerified,
                    isEmailVerified: userData.isEmailVerified,
                    isPhoneVerified: userData.isPhoneVerified,
                    status: userData.status,
                    isTestUser: userData.isTestUser || true,
                },
            });

            // Get roles by name
            const roles = await prisma.role.findMany({
                where: {
                    name: {
                        in: userData.roles,
                    },
                },
            });

            // Delete existing user roles
            await prisma.userRole.deleteMany({
                where: { userId: user.id },
            });

            // Assign roles to user
            if (roles.length > 0) {
                await prisma.userRole.createMany({
                    data: roles.map((role) => ({
                        userId: user.id,
                        roleId: role.id,
                    })),
                    skipDuplicates: true,
                });
            }

            createdUsers.push(user);
            console.log(`User "${user.name}" (${user.email || user.phoneNumber}) seeded with ${roles.length} role(s)`);
        }

        console.log(`Successfully seeded ${createdUsers.length} users`);
        return createdUsers;
    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedUsers()
        .then(() => {
            console.log('Users seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Users seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
