import { prisma } from "../../src/utils/prisma.client";

export async function seedLocations() {
    console.log("🌍 Seeding Theater Location...");

    // 1. CREATE LOCATION
    const location = await prisma.location.upsert({
        where: { locationSlug: "theater" },
        update: {},
        create: {
            name: { en: "Theater", ar: "المسرح" },
            locationSlug: "theater",
            description: { en: "Theater seating layout based on CAD design." },
            type: "THEATRE",
            active: true,
            latitude: null,
            longitude: null
        }
    });

    console.log("✅ Location created:", location.id);

    // 2. TEMPLATE CONFIG
    const templateConfig = {
        Center: {
            zones: [
                {
                    zone: "VVIP",
                    rows: [
                        { rowNumber: 1, seats: 36 },
                        { rowNumber: 2, seats: 38 },
                        { rowNumber: 3, seats: 40 }
                    ]
                },
                {
                    zone: "VIP",
                    rows: [
                        { rowNumber: 4, seats: 42 },
                        { rowNumber: 5, seats: 44 },
                        { rowNumber: 6, seats: 46 },
                        { rowNumber: 7, seats: 48 }
                    ]
                },
                {
                    zone: "REGULAR",
                    rows: [
                        { rowNumber: 8, seats: 50 },
                        { rowNumber: 9, seats: 52 },
                        { rowNumber: 10, seats: 54 },
                        { rowNumber: 11, seats: 56 },
                        { rowNumber: 12, seats: 58 }
                    ]
                },
                {
                    zone: "ECONOMY",
                    rows: [
                        { rowNumber: 13, seats: 60 },
                        { rowNumber: 14, seats: 60 },
                        { rowNumber: 15, seats: 60 }
                    ]
                }
            ]
        },

        Left: {
            zones: [
                {
                    zone: "VIP",
                    rows: [
                        { rowNumber: 1, seats: 12 },
                        { rowNumber: 2, seats: 14 },
                        { rowNumber: 3, seats: 16 },
                        { rowNumber: 4, seats: 18 }
                    ]
                },
                {
                    zone: "REGULAR",
                    rows: [
                        { rowNumber: 5, seats: 18 },
                        { rowNumber: 6, seats: 20 },
                        { rowNumber: 7, seats: 20 },
                        { rowNumber: 8, seats: 22 }
                    ]
                },
                {
                    zone: "ECONOMY",
                    rows: [
                        { rowNumber: 9, seats: 22 },
                        { rowNumber: 10, seats: 22 },
                        { rowNumber: 11, seats: 22 }
                    ]
                }
            ]
        },

        Right: {
            zones: [
                {
                    zone: "VIP",
                    rows: [
                        { rowNumber: 1, seats: 12 },
                        { rowNumber: 2, seats: 14 },
                        { rowNumber: 3, seats: 16 },
                        { rowNumber: 4, seats: 18 }
                    ]
                },
                {
                    zone: "REGULAR",
                    rows: [
                        { rowNumber: 5, seats: 18 },
                        { rowNumber: 6, seats: 20 },
                        { rowNumber: 7, seats: 20 },
                        { rowNumber: 8, seats: 22 }
                    ]
                },
                {
                    zone: "ECONOMY",
                    rows: [
                        { rowNumber: 9, seats: 22 },
                        { rowNumber: 10, seats: 22 },
                        { rowNumber: 11, seats: 22 }
                    ]
                }
            ]
        }
    };

    console.log("📝 Seeding theater template...");

    // 3. CREATE TEMPLATE
    await prisma.locationTemplate.upsert({
        where: { locationId: location.id },
        update: { config: templateConfig, active: true },
        create: {
            name: "Theater Template",
            locationId: location.id,
            config: templateConfig,
            active: true
        }
    });

    console.log("🎉 Theater Template created successfully!");
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
