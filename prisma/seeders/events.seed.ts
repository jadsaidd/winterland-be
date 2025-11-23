import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EventData {
    name: {
        en: string;
        ar: string;
    };
    description: {
        en: string;
        ar: string;
    };
    startAt: Date;
    endAt: Date;
    originalPrice: number;
    discountedPrice?: number;
    active: boolean;
    mediaUrls: string[];
}

export const eventsData: EventData[] = [
    // November 21, 2025 - 7 events
    {
        name: {
            en: 'Winter Night Celebration',
            ar: 'احتفال ليلة الشتاء',
        },
        description: {
            en: 'Join us for an amazing winter night celebration with activities and entertainment for the whole family.',
            ar: 'انضم إلينا في احتفال ليلة شتوية مذهلة مع أنشطة وترفيه لجميع أفراد العائلة.',
        },
        startAt: new Date('2025-11-21T22:30:00.000Z'), // 10:30 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 150,
        discountedPrice: 120,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/orange/white.png'],
    },
    {
        name: {
            en: 'Ice Skating Extravaganza',
            ar: 'مهرجان التزلج على الجليد',
        },
        description: {
            en: 'Experience the thrill of ice skating in our world-class winter wonderland venue.',
            ar: 'اختبر إثارة التزلج على الجليد في مكاننا الشتوي عالمي المستوى.',
        },
        startAt: new Date('2025-11-21T22:45:00.000Z'), // 10:45 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 200,
        discountedPrice: 175,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/blue/white.png'],
    },
    {
        name: {
            en: 'Snow Adventure Night',
            ar: 'ليلة مغامرة الثلج',
        },
        description: {
            en: 'An unforgettable snow adventure awaits you with exciting winter sports and activities.',
            ar: 'مغامرة ثلجية لا تُنسى تنتظرك مع رياضات وأنشطة شتوية مثيرة.',
        },
        startAt: new Date('2025-11-21T23:00:00.000Z'), // 11:00 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 180,
        discountedPrice: 150,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/purple/white.png'],
    },
    {
        name: {
            en: 'Midnight Winter Magic',
            ar: 'سحر الشتاء في منتصف الليل',
        },
        description: {
            en: 'Experience the magical atmosphere of winter under the stars with live entertainment.',
            ar: 'استمتع بالأجواء السحرية للشتاء تحت النجوم مع الترفيه الحي.',
        },
        startAt: new Date('2025-11-21T23:15:00.000Z'), // 11:15 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 220,
        discountedPrice: 190,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/red/white.png'],
    },
    {
        name: {
            en: 'Family Fun Ice Show',
            ar: 'عرض الجليد الترفيهي العائلي',
        },
        description: {
            en: 'A spectacular ice show featuring professional skaters and stunning performances.',
            ar: 'عرض جليد مذهل يضم متزلجين محترفين وعروضاً مبهرة.',
        },
        startAt: new Date('2025-11-21T23:30:00.000Z'), // 11:30 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 250,
        discountedPrice: 200,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/green/white.png'],
    },
    {
        name: {
            en: 'Winter Carnival Night',
            ar: 'ليلة كرنفال الشتاء',
        },
        description: {
            en: 'Join the ultimate winter carnival with games, food, and entertainment for everyone.',
            ar: 'انضم إلى كرنفال الشتاء النهائي مع الألعاب والطعام والترفيه للجميع.',
        },
        startAt: new Date('2025-11-21T23:40:00.000Z'), // 11:40 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 170,
        discountedPrice: 140,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/pink/white.png'],
    },
    {
        name: {
            en: 'Late Night Winter Blast',
            ar: 'انفجار الشتاء في وقت متأخر من الليل',
        },
        description: {
            en: 'End your night with an explosive winter celebration full of excitement and fun.',
            ar: 'أنهِ ليلتك باحتفال شتوي مثير مليء بالإثارة والمرح.',
        },
        startAt: new Date('2025-11-21T23:50:00.000Z'), // 11:50 PM
        endAt: new Date('2025-11-21T23:59:00.000Z'), // 11:59 PM
        originalPrice: 160,
        discountedPrice: 130,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/yellow/black.png'],
    },

    // November 22, 2025 - 3 events
    {
        name: {
            en: 'Morning Winter Wonderland',
            ar: 'عالم الشتاء الصباحي',
        },
        description: {
            en: 'Start your day with a beautiful winter experience in our enchanting wonderland.',
            ar: 'ابدأ يومك بتجربة شتوية جميلة في عالمنا الساحر.',
        },
        startAt: new Date('2025-11-22T08:00:00.000Z'), // 8:00 AM
        endAt: new Date('2025-11-22T12:00:00.000Z'), // 12:00 PM
        originalPrice: 190,
        discountedPrice: 160,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/cyan/white.png'],
    },
    {
        name: {
            en: 'Afternoon Snow Festival',
            ar: 'مهرجان الثلج بعد الظهر',
        },
        description: {
            en: 'Enjoy an afternoon filled with snow activities and winter sports for all ages.',
            ar: 'استمتع بفترة ما بعد الظهر المليئة بأنشطة الثلج والرياضات الشتوية لجميع الأعمار.',
        },
        startAt: new Date('2025-11-22T14:00:00.000Z'), // 2:00 PM
        endAt: new Date('2025-11-22T18:00:00.000Z'), // 6:00 PM
        originalPrice: 210,
        discountedPrice: 180,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/teal/white.png'],
    },
    {
        name: {
            en: 'Evening Winter Gala',
            ar: 'حفل الشتاء المسائي',
        },
        description: {
            en: 'An elegant evening winter gala featuring fine dining and live performances.',
            ar: 'حفل شتاء مسائي أنيق يتضمن تناول طعام فاخر وعروضاً حية.',
        },
        startAt: new Date('2025-11-22T19:00:00.000Z'), // 7:00 PM
        endAt: new Date('2025-11-22T23:00:00.000Z'), // 11:00 PM
        originalPrice: 300,
        discountedPrice: 250,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/indigo/white.png'],
    },
];

export async function seedEvents() {
    console.log('Seeding events...');

    const locationId = 'cmi1hvia30006yqfn1s2kpgsx';
    const categoryId = 'cmi0pyq3w005d11flo9r7w6bu';

    try {
        // Verify location exists
        const location = await prisma.location.findUnique({
            where: { id: locationId },
        });

        if (!location) {
            console.error(`Location with ID ${locationId} not found. Please create it first.`);
            return;
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            console.error(`Category with ID ${categoryId} not found. Please create it first.`);
            return;
        }

        const createdEvents = [];

        for (const eventData of eventsData) {
            // Generate slug from English name
            const slug = eventData.name.en
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            // Create or find media for the event
            const mediaRecords = [];
            for (const mediaUrl of eventData.mediaUrls) {
                let media = await prisma.media.findFirst({
                    where: { url: mediaUrl },
                });

                if (!media) {
                    media = await prisma.media.create({
                        data: {
                            url: mediaUrl,
                            type: 'IMAGE',
                            context: 'Event media',
                        },
                    });
                }
                mediaRecords.push(media);
            }

            // Create or update the event
            const event = await prisma.event.upsert({
                where: { eventSlug: slug },
                update: {
                    name: eventData.name,
                    description: eventData.description,
                    startAt: eventData.startAt,
                    endAt: eventData.endAt,
                    originalPrice: eventData.originalPrice,
                    discountedPrice: eventData.discountedPrice,
                    active: eventData.active,
                },
                create: {
                    name: eventData.name,
                    eventSlug: slug,
                    description: eventData.description,
                    startAt: eventData.startAt,
                    endAt: eventData.endAt,
                    originalPrice: eventData.originalPrice,
                    discountedPrice: eventData.discountedPrice,
                    active: eventData.active,
                },
            });

            // Link event to category
            await prisma.eventCategory.upsert({
                where: {
                    eventId_categoryId: {
                        eventId: event.id,
                        categoryId: categoryId,
                    },
                },
                update: {},
                create: {
                    eventId: event.id,
                    categoryId: categoryId,
                },
            });

            // Link event to location
            await prisma.eventLocation.upsert({
                where: {
                    eventId_locationId: {
                        eventId: event.id,
                        locationId: locationId,
                    },
                },
                update: {},
                create: {
                    eventId: event.id,
                    locationId: locationId,
                },
            });

            // Link media to event
            for (let i = 0; i < mediaRecords.length; i++) {
                await prisma.eventMedia.upsert({
                    where: {
                        eventId_mediaId: {
                            eventId: event.id,
                            mediaId: mediaRecords[i].id,
                        },
                    },
                    update: {
                        sortOrder: i,
                    },
                    create: {
                        eventId: event.id,
                        mediaId: mediaRecords[i].id,
                        sortOrder: i,
                    },
                });
            }

            createdEvents.push(event);
            console.log(`✓ Seeded event: ${eventData.name.en} (${slug})`);
        }

        console.log(`Successfully seeded ${createdEvents.length} events`);
        return createdEvents;
    } catch (error) {
        console.error('Error seeding events:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedEvents()
        .then(() => {
            console.log('Events seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Events seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
