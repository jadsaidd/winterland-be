import { LocationType } from "@prisma/client";
import { prisma } from "../../src/utils/prisma.client";

// ============================================
// LOCATION DATA
// ============================================

interface LocationData {
    name: { en: string; ar: string };
    slug: string;
    description: { en: string; ar: string };
    type: LocationType;
    capacity: number | null;
    latitude: number | null;
    longitude: number | null;
    active: boolean;
}

const locationsData: LocationData[] = [
    {
        name: { en: "Main Stadium", ar: "الملعب الرئيسي" },
        slug: "main-stadium",
        description: {
            en: "Large outdoor stadium for major events and concerts",
            ar: "ملعب خارجي كبير للفعاليات الكبرى والحفلات الموسيقية",
        },
        type: "STADIUM",
        capacity: 50000,
        latitude: 25.2048,
        longitude: 55.2708,
        active: true,
    },
    {
        name: { en: "Winter Stage", ar: "مسرح الشتاء" },
        slug: "winter-stage",
        description: {
            en: "Elevated stage for performances and shows",
            ar: "منصة مرتفعة للعروض والحفلات",
        },
        type: "STAGE",
        capacity: 2000,
        latitude: 25.1972,
        longitude: 55.2744,
        active: true,
    },
    {
        name: { en: "Ice Arena", ar: "ساحة الجليد" },
        slug: "ice-arena",
        description: {
            en: "Indoor ice arena for skating and hockey events",
            ar: "ساحة جليد داخلية للتزلج وفعاليات الهوكي",
        },
        type: "ARENA",
        capacity: 15000,
        latitude: 25.2285,
        longitude: 55.2867,
        active: true,
    },
    {
        name: { en: "Grand Theatre", ar: "المسرح الكبير" },
        slug: "grand-theatre",
        description: {
            en: "Elegant theatre for plays, operas, and cultural performances",
            ar: "مسرح أنيق للمسرحيات والأوبرا والعروض الثقافية",
        },
        type: "THEATRE",
        capacity: 1500,
        latitude: 25.2048,
        longitude: 55.2708,
        active: true,
    },
    {
        name: { en: "Convention Hall", ar: "قاعة المؤتمرات" },
        slug: "convention-hall",
        description: {
            en: "Multi-purpose hall for conferences and exhibitions",
            ar: "قاعة متعددة الأغراض للمؤتمرات والمعارض",
        },
        type: "HALL",
        capacity: 3000,
        latitude: 25.1123,
        longitude: 55.1389,
        active: true,
    },
    {
        name: { en: "Snow Park", ar: "حديقة الثلج" },
        slug: "snow-park",
        description: {
            en: "Outdoor snow park with winter activities and attractions",
            ar: "حديقة ثلج خارجية مع أنشطة ومعالم شتوية",
        },
        type: "OUTDOOR",
        capacity: 5000,
        latitude: 25.1972,
        longitude: 55.2744,
        active: true,
    },
    {
        name: { en: "Winter Wonderland Indoor", ar: "أرض العجائب الشتوية الداخلية" },
        slug: "winter-wonderland-indoor",
        description: {
            en: "Climate-controlled indoor winter experience",
            ar: "تجربة شتوية داخلية مع تحكم في المناخ",
        },
        type: "INDOOR",
        capacity: 8000,
        latitude: 25.0657,
        longitude: 55.1713,
        active: true,
    },
    {
        name: { en: "Event Space", ar: "مساحة الفعاليات" },
        slug: "event-space",
        description: {
            en: "Flexible event space for various occasions",
            ar: "مساحة فعاليات مرنة للمناسبات المختلفة",
        },
        type: "OTHER",
        capacity: 1000,
        latitude: 25.2285,
        longitude: 55.2867,
        active: true,
    },
];

// ============================================
// MAIN SEEDER FUNCTION
// ============================================

export async function seedLocationsSimple() {
    console.log("Starting Simple Locations Seeding...\n");

    const createdLocations = [];

    for (const locationData of locationsData) {
        const location = await prisma.location.upsert({
            where: { locationSlug: locationData.slug },
            update: {
                name: locationData.name,
                description: locationData.description,
                type: locationData.type,
                capacity: locationData.capacity,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                active: locationData.active,
            },
            create: {
                name: locationData.name,
                locationSlug: locationData.slug,
                description: locationData.description,
                type: locationData.type,
                capacity: locationData.capacity,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                active: locationData.active,
            },
        });

        createdLocations.push(location);
        console.log(`✓ Location "${locationData.name.en}" (${locationData.type}) - ${location.id}`);
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log("\n" + "═".repeat(50));
    console.log("SEEDING SUMMARY");
    console.log("═".repeat(50));
    console.log(`   Total locations created: ${createdLocations.length}`);
    console.log("\n   Locations by type:");

    const typeCount: Record<string, number> = {};
    for (const loc of createdLocations) {
        typeCount[loc.type] = (typeCount[loc.type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(typeCount)) {
        console.log(`     - ${type}: ${count}`);
    }

    console.log("═".repeat(50));
    console.log("\n✓ Simple Locations seeding completed successfully!");

    return createdLocations;
}

// Allow running this seeder independently
if (require.main === module) {
    seedLocationsSimple()
        .then(() => {
            console.log("\nLocations seeding completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Locations seeding failed:", error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
