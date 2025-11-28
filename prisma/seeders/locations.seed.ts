import { ZoneType, SectionPosition } from "@prisma/client";
import { prisma } from "../../src/utils/prisma.client";

// ============================================
// CONFIGURATION DATA
// ============================================

// Zone configuration with priorities (lower = higher priority)
const ZONE_CONFIG: { type: ZoneType; priority: number; rowRange: [number, number] }[] = [
    { type: "VVIP", priority: 1, rowRange: [1, 2] },      // Rows 1-2
    { type: "VIP", priority: 2, rowRange: [3, 5] },       // Rows 3-5
    { type: "REGULAR", priority: 3, rowRange: [6, 8] },   // Rows 6-8
    { type: "ECONOMY", priority: 4, rowRange: [9, 14] },  // Rows 9-14
];

// Section position mapping for seat labels
const SECTION_LABEL_MAP: Record<SectionPosition, string> = {
    CENTER: "C",
    LEFT: "L",
    RIGHT: "R",
};

// Seat counts per row for each section (14 rows each)
const SEAT_COUNTS: Record<SectionPosition, number[]> = {
    CENTER: [60, 62, 64, 66, 68, 70, 72, 74, 74, 76, 76, 76, 76, 76],
    LEFT: [8, 12, 11, 14, 15, 17, 18, 15, 8, 8, 12, 16, 17, 18],
    RIGHT: [8, 12, 11, 14, 15, 17, 18, 15, 8, 8, 12, 16, 17, 18],
};

const TOTAL_ROWS = 14;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate seat label in format: ZONE-SECTION-ROW-SEAT
 * Example: VVIP-C-1-1, VIP-L-3-5, ECONOMY-R-14-18
 */
function generateSeatLabel(
    zoneType: ZoneType,
    sectionPosition: SectionPosition,
    rowNumber: number,
    seatNumber: number
): string {
    const sectionLabel = SECTION_LABEL_MAP[sectionPosition];
    return `${zoneType}-${sectionLabel}-${rowNumber}-${seatNumber}`;
}

/**
 * Build the template config JSON for LocationTemplate
 */
function buildTemplateConfig() {
    const config: Record<string, { zones: { zone: string; rows: { rowNumber: number; seats: number }[] }[] }> = {};

    for (const section of Object.keys(SEAT_COUNTS) as SectionPosition[]) {
        const sectionKey = section.charAt(0) + section.slice(1).toLowerCase(); // CENTER -> Center
        const zones: { zone: string; rows: { rowNumber: number; seats: number }[] }[] = [];

        for (const zoneConfig of ZONE_CONFIG) {
            const rows: { rowNumber: number; seats: number }[] = [];
            for (let row = zoneConfig.rowRange[0]; row <= zoneConfig.rowRange[1]; row++) {
                rows.push({
                    rowNumber: row,
                    seats: SEAT_COUNTS[section][row - 1], // 0-indexed array
                });
            }
            zones.push({ zone: zoneConfig.type, rows });
        }

        config[sectionKey] = { zones };
    }

    return config;
}

// ============================================
// MAIN SEEDER FUNCTION
// ============================================

export async function seedLocations() {
    console.log("Starting Stage Location Seeding...\n");

    // ========================================
    // 1. CREATE LOCATION
    // ========================================
    console.log("Creating Location...");
    const location = await prisma.location.upsert({
        where: { locationSlug: "stage" },
        update: {},
        create: {
            name: { en: "Stage", ar: "المسرح" },
            locationSlug: "stage",
            description: { en: "Stage seating layout with 14 rows across all sections.", ar: "تخطيط مقاعد المسرح مع 14 صفاً في جميع الأقسام." },
            type: "STAGE",
            active: true,
            latitude: null,
            longitude: null,
        },
    });
    console.log(`Location created: ${location.id}\n`);

    // ========================================
    // 2. CREATE ZONES (global, not location-specific)
    // ========================================
    console.log("Creating Zones...");
    const zones: Record<ZoneType, string> = {} as Record<ZoneType, string>;

    for (const zoneConfig of ZONE_CONFIG) {
        const zone = await prisma.zone.upsert({
            where: { type: zoneConfig.type },
            update: { priority: zoneConfig.priority },
            create: {
                type: zoneConfig.type,
                priority: zoneConfig.priority,
            },
        });
        zones[zoneConfig.type] = zone.id;
        console.log(`"Zone ${zoneConfig.type} (priority: ${zoneConfig.priority}) - ${zone.id}`);
    }
    console.log("");

    // ========================================
    // 3. CREATE LOCATION ZONES (pivot table)
    // ========================================
    console.log("🔗 Creating Location-Zone relationships...");
    const locationZones: Record<ZoneType, string> = {} as Record<ZoneType, string>;

    for (const zoneType of Object.keys(zones) as ZoneType[]) {
        const locationZone = await prisma.locationZone.upsert({
            where: {
                locationId_zoneId: {
                    locationId: location.id,
                    zoneId: zones[zoneType],
                },
            },
            update: {},
            create: {
                locationId: location.id,
                zoneId: zones[zoneType],
            },
        });
        locationZones[zoneType] = locationZone.id;
        console.log(`"LocationZone for ${zoneType} - ${locationZone.id}`);
    }
    console.log("");

    // ========================================
    // 4. CREATE SECTIONS, ROWS, AND SEATS
    // ========================================
    console.log("Creating Sections, Rows, and Seats...\n");

    let totalSeatsCreated = 0;
    let globalRowOrder = 1; // Global row order counter across all sections/zones

    for (const sectionPosition of Object.keys(SEAT_COUNTS) as SectionPosition[]) {
        console.log(`Section: ${sectionPosition}`);

        // Group rows by zone for this section
        for (const zoneConfig of ZONE_CONFIG) {
            const zoneType = zoneConfig.type;
            const locationZoneId = locationZones[zoneType];
            const rowsInZone = zoneConfig.rowRange[1] - zoneConfig.rowRange[0] + 1;

            // Check if section already exists
            let section = await prisma.locationSection.findFirst({
                where: {
                    locationZoneId,
                    position: sectionPosition,
                },
            });

            if (!section) {
                section = await prisma.locationSection.create({
                    data: {
                        position: sectionPosition,
                        numberOfRows: rowsInZone,
                        locationZoneId,
                    },
                });
            }

            console.log(`Zone ${zoneType} (${rowsInZone} rows) - Section ID: ${section.id}`);

            // Create rows for this zone-section combination
            for (let rowNumber = zoneConfig.rowRange[0]; rowNumber <= zoneConfig.rowRange[1]; rowNumber++) {
                const seatCount = SEAT_COUNTS[sectionPosition][rowNumber - 1]; // 0-indexed array

                // Upsert row
                let row = await prisma.locationRow.findUnique({
                    where: {
                        sectionId_rowNumber: {
                            sectionId: section.id,
                            rowNumber,
                        },
                    },
                });

                if (!row) {
                    row = await prisma.locationRow.create({
                        data: {
                            rowNumber,
                            order: globalRowOrder,
                            sectionId: section.id,
                        },
                    });
                }

                // Create seats for this row
                const seatsToCreate = [];
                for (let seatNumber = 1; seatNumber <= seatCount; seatNumber++) {
                    const seatLabel = generateSeatLabel(zoneType, sectionPosition, rowNumber, seatNumber);
                    seatsToCreate.push({
                        seatNumber,
                        seatLabel,
                        rowId: row.id,
                    });
                }

                // Use createMany with skipDuplicates for efficiency
                const result = await prisma.locationSeat.createMany({
                    data: seatsToCreate,
                    skipDuplicates: true,
                });

                totalSeatsCreated += result.count;
                console.log(`Row ${rowNumber}: ${result.count} seats created (order: ${globalRowOrder})`);

                globalRowOrder++;
            }
        }
        console.log("");
    }

    // ========================================
    // 5. CREATE LOCATION TEMPLATE
    // ========================================
    console.log("Creating Location Template...");
    const templateConfig = buildTemplateConfig();

    await prisma.locationTemplate.upsert({
        where: { locationId: location.id },
        update: { config: templateConfig, active: true },
        create: {
            name: "Stage Template",
            locationId: location.id,
            config: templateConfig,
            active: true,
        },
    });
    console.log("Location Template created\n");

    // ========================================
    // 6. UPDATE LOCATION CAPACITY
    // ========================================
    const totalCapacity = Object.values(SEAT_COUNTS).flat().reduce((sum, count) => sum + count, 0);
    await prisma.location.update({
        where: { id: location.id },
        data: { capacity: totalCapacity },
    });

    // ========================================
    // SUMMARY
    // ========================================
    console.log("═".repeat(50));
    console.log("SEEDING SUMMARY");
    console.log("═".repeat(50));
    console.log(`   Location: ${location.locationSlug}`);
    console.log(`   Zones: ${ZONE_CONFIG.length}`);
    console.log(`   Sections: ${Object.keys(SEAT_COUNTS).length} (Center, Left, Right)`);
    console.log(`   Rows per section: ${TOTAL_ROWS}`);
    console.log(`   Total capacity: ${totalCapacity} seats`);
    console.log(`   Seats created in this run: ${totalSeatsCreated}`);
    console.log("═".repeat(50));

    // Detailed breakdown
    console.log("\nSEAT BREAKDOWN BY SECTION:");
    for (const section of Object.keys(SEAT_COUNTS) as SectionPosition[]) {
        const sectionTotal = SEAT_COUNTS[section].reduce((sum, count) => sum + count, 0);
        console.log(`   ${section}: ${sectionTotal} seats`);
    }

    console.log("\nSEAT BREAKDOWN BY ZONE:");
    for (const zoneConfig of ZONE_CONFIG) {
        let zoneTotal = 0;
        for (const section of Object.keys(SEAT_COUNTS) as SectionPosition[]) {
            for (let row = zoneConfig.rowRange[0]; row <= zoneConfig.rowRange[1]; row++) {
                zoneTotal += SEAT_COUNTS[section][row - 1];
            }
        }
        console.log(`   ${zoneConfig.type}: ${zoneTotal} seats (rows ${zoneConfig.rowRange[0]}-${zoneConfig.rowRange[1]})`);
    }

    console.log("Stage Location seeding completed successfully!");
}

// Allow running this seeder independently
if (require.main === module) {
    seedLocations()
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
