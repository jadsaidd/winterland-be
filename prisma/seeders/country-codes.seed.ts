import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MediaData {
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
    context?: string;
}

export interface CountryCodeData {
    country: string;
    code: string;
    isoCode: string;
    digits: number;
    flagUrl: string;
    active: boolean;
}

export const countryCodesData: CountryCodeData[] = [
    {
        country: 'United Arab Emirates',
        code: '+971',
        isoCode: 'AE',
        digits: 9,
        flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_the_United_Arab_Emirates.svg/960px-Flag_of_the_United_Arab_Emirates.svg.png',
        active: true,
    },
    {
        country: 'Lebanon',
        code: '+961',
        isoCode: 'LB',
        digits: 8,
        flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Flag_of_Lebanon.svg/1024px-Flag_of_Lebanon.svg.png',
        active: true,
    },
];

export async function seedCountryCodes() {
    console.log('Seeding country codes...');

    try {
        const createdCountryCodes = [];

        for (const countryData of countryCodesData) {
            // First, find or create the media for the flag
            let flagMedia = await prisma.media.findFirst({
                where: {
                    url: countryData.flagUrl,
                },
            });

            if (!flagMedia) {
                flagMedia = await prisma.media.create({
                    data: {
                        url: countryData.flagUrl,
                        type: 'IMAGE',
                        context: `Flag of ${countryData.country}`,
                        uploadedBy: null,
                    },
                });
            }

            // Then create or update the country code
            const countryCode = await prisma.countryCode.upsert({
                where: { code: countryData.code },
                update: {
                    country: countryData.country,
                    isoCode: countryData.isoCode,
                    digits: countryData.digits,
                    active: countryData.active,
                    flagMediaId: flagMedia.id,
                    flagUrl: countryData.flagUrl,
                },
                create: {
                    country: countryData.country,
                    code: countryData.code,
                    isoCode: countryData.isoCode,
                    digits: countryData.digits,
                    active: countryData.active,
                    flagMediaId: flagMedia.id,
                    flagUrl: countryData.flagUrl,
                },
            });

            createdCountryCodes.push(countryCode);
            console.log(`Country code "${countryCode.country} (${countryCode.code})" seeded`);
        }

        console.log(`Successfully seeded ${createdCountryCodes.length} country codes`);
        return createdCountryCodes;
    } catch (error) {
        console.error('Error seeding country codes:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedCountryCodes()
        .then(() => {
            console.log('Country codes seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Country codes seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
