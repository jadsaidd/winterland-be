import { prisma } from "../../src/utils/prisma.client";

export async function seedLocations() {
    console.log("Seeding Stage Location...");

    // 1. CREATE LOCATION
    const location = await prisma.location.upsert({
        where: { locationSlug: "stage" },
        update: {},
        create: {
            name: { en: "Stage", ar: "المسرح" },
            locationSlug: "stage",
            description: { en: "Stage seating layout with 14 rows across all sections." },
            type: "STAGE",
            active: true,
            latitude: null,
            longitude: null
        }
    });

    console.log("Location created:", location.id);

    // 2. TEMPLATE CONFIG
    // All sections have 14 rows total
    // Rows 1-2: VVIP, Rows 3-5: VIP, Rows 6-8: REGULAR, Rows 9-14: ECONOMY
    const templateConfig = {
        Center: {
            zones: [
                {
                    zone: "VVIP",
                    rows: [
                        { rowNumber: 1, seats: 60 },
                        { rowNumber: 2, seats: 62 }
                    ]
                },
                {
                    zone: "VIP",
                    rows: [
                        { rowNumber: 3, seats: 64 },
                        { rowNumber: 4, seats: 66 },
                        { rowNumber: 5, seats: 68 }
                    ]
                },
                {
                    zone: "REGULAR",
                    rows: [
                        { rowNumber: 6, seats: 70 },
                        { rowNumber: 7, seats: 72 },
                        { rowNumber: 8, seats: 74 }
                    ]
                },
                {
                    zone: "ECONOMY",
                    rows: [
                        { rowNumber: 9, seats: 74 },
                        { rowNumber: 10, seats: 76 },
                        { rowNumber: 11, seats: 76 },
                        { rowNumber: 12, seats: 76 },
                        { rowNumber: 13, seats: 76 },
                        { rowNumber: 14, seats: 76 }
                    ]
                }
            ]
        },

        Left: {
            zones: [
                {
                    zone: "VVIP",
                    rows: [
                        { rowNumber: 1, seats: 8 },
                        { rowNumber: 2, seats: 12 }
                    ]
                },
                {
                    zone: "VIP",
                    rows: [
                        { rowNumber: 3, seats: 11 },
                        { rowNumber: 4, seats: 14 },
                        { rowNumber: 5, seats: 15 }
                    ]
                },
                {
                    zone: "REGULAR",
                    rows: [
                        { rowNumber: 6, seats: 17 },
                        { rowNumber: 7, seats: 18 },
                        { rowNumber: 8, seats: 15 }
                    ]
                },
                {
                    zone: "ECONOMY",
                    rows: [
                        { rowNumber: 9, seats: 8 },
                        { rowNumber: 10, seats: 8 },
                        { rowNumber: 11, seats: 12 },
                        { rowNumber: 12, seats: 16 },
                        { rowNumber: 13, seats: 17 },
                        { rowNumber: 14, seats: 18 }
                    ]
                }
            ]
        },

        Right: {
            zones: [
                {
                    zone: "VVIP",
                    rows: [
                        { rowNumber: 1, seats: 8 },
                        { rowNumber: 2, seats: 12 }
                    ]
                },
                {
                    zone: "VIP",
                    rows: [
                        { rowNumber: 3, seats: 11 },
                        { rowNumber: 4, seats: 14 },
                        { rowNumber: 5, seats: 15 }
                    ]
                },
                {
                    zone: "REGULAR",
                    rows: [
                        { rowNumber: 6, seats: 17 },
                        { rowNumber: 7, seats: 18 },
                        { rowNumber: 8, seats: 15 }
                    ]
                },
                {
                    zone: "ECONOMY",
                    rows: [
                        { rowNumber: 9, seats: 8 },
                        { rowNumber: 10, seats: 8 },
                        { rowNumber: 11, seats: 12 },
                        { rowNumber: 12, seats: 16 },
                        { rowNumber: 13, seats: 17 },
                        { rowNumber: 14, seats: 18 }
                    ]
                }
            ]
        }
    };

    console.log("Seeding stage template...");

    // 3. CREATE TEMPLATE
    await prisma.locationTemplate.upsert({
        where: { locationId: location.id },
        update: { config: templateConfig, active: true },
        create: {
            name: "Stage Template",
            locationId: location.id,
            config: templateConfig,
            active: true
        }
    });

    console.log("Stage Template created successfully!");
}

// Allow running this seeder independently
if (require.main === module) {
    seedLocations()
        .then(() => {
            console.log('Locations seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Locations seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
