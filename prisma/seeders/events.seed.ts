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
    // December 2, 2025
    {
        name: {
            en: 'Winter Night Celebration',
            ar: 'احتفال ليلة الشتاء',
        },
        description: {
            en: 'Join us for an amazing winter night celebration with activities and entertainment for the whole family.',
            ar: 'انضم إلينا في احتفال ليلة شتوية مذهلة مع أنشطة وترفيه لجميع أفراد العائلة.',
        },
        startAt: new Date('2025-12-02T10:00:00.000Z'),
        endAt: new Date('2025-12-02T14:00:00.000Z'),
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
        startAt: new Date('2025-12-03T09:00:00.000Z'),
        endAt: new Date('2025-12-03T12:00:00.000Z'),
        originalPrice: 200,
        discountedPrice: 175,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/blue/white.png'],
    },
    // December 4, 2025
    {
        name: {
            en: 'Snow Adventure Night',
            ar: 'ليلة مغامرة الثلج',
        },
        description: {
            en: 'An unforgettable snow adventure awaits you with exciting winter sports and activities.',
            ar: 'مغامرة ثلجية لا تُنسى تنتظرك مع رياضات وأنشطة شتوية مثيرة.',
        },
        startAt: new Date('2025-12-04T14:00:00.000Z'),
        endAt: new Date('2025-12-04T20:00:00.000Z'),
        originalPrice: 180,
        discountedPrice: 150,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/purple/white.png'],
    },
    // December 6, 2025
    {
        name: {
            en: 'Midnight Winter Magic',
            ar: 'سحر الشتاء في منتصف الليل',
        },
        description: {
            en: 'Experience the magical atmosphere of winter under the stars with live entertainment.',
            ar: 'استمتع بالأجواء السحرية للشتاء تحت النجوم مع الترفيه الحي.',
        },
        startAt: new Date('2025-12-06T18:00:00.000Z'),
        endAt: new Date('2025-12-06T23:59:00.000Z'),
        originalPrice: 220,
        discountedPrice: 190,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/red/white.png'],
    },
    // December 8, 2025
    {
        name: {
            en: 'Family Fun Ice Show',
            ar: 'عرض الجليد الترفيهي العائلي',
        },
        description: {
            en: 'A spectacular ice show featuring professional skaters and stunning performances.',
            ar: 'عرض جليد مذهل يضم متزلجين محترفين وعروضاً مبهرة.',
        },
        startAt: new Date('2025-12-08T11:00:00.000Z'),
        endAt: new Date('2025-12-08T15:00:00.000Z'),
        originalPrice: 250,
        discountedPrice: 200,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/green/white.png'],
    },
    // December 10, 2025
    {
        name: {
            en: 'Winter Carnival Night',
            ar: 'ليلة كرنفال الشتاء',
        },
        description: {
            en: 'Join the ultimate winter carnival with games, food, and entertainment for everyone.',
            ar: 'انضم إلى كرنفال الشتاء النهائي مع الألعاب والطعام والترفيه للجميع.',
        },
        startAt: new Date('2025-12-10T16:00:00.000Z'),
        endAt: new Date('2025-12-10T22:00:00.000Z'),
        originalPrice: 170,
        discountedPrice: 140,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/pink/white.png'],
    },
    // December 12, 2025
    {
        name: {
            en: 'Late Night Winter Blast',
            ar: 'انفجار الشتاء في وقت متأخر من الليل',
        },
        description: {
            en: 'End your night with an explosive winter celebration full of excitement and fun.',
            ar: 'أنهِ ليلتك باحتفال شتوي مثير مليء بالإثارة والمرح.',
        },
        startAt: new Date('2025-12-12T19:00:00.000Z'),
        endAt: new Date('2025-12-13T01:00:00.000Z'),
        originalPrice: 160,
        discountedPrice: 130,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/yellow/black.png'],
    },
    // December 14, 2025
    {
        name: {
            en: 'Morning Winter Wonderland',
            ar: 'عالم الشتاء الصباحي',
        },
        description: {
            en: 'Start your day with a beautiful winter experience in our enchanting wonderland.',
            ar: 'ابدأ يومك بتجربة شتوية جميلة في عالمنا الساحر.',
        },
        startAt: new Date('2025-12-14T08:00:00.000Z'),
        endAt: new Date('2025-12-14T13:00:00.000Z'),
        originalPrice: 190,
        discountedPrice: 160,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/cyan/white.png'],
    },
    // December 16, 2025
    {
        name: {
            en: 'Afternoon Snow Festival',
            ar: 'مهرجان الثلج بعد الظهر',
        },
        description: {
            en: 'Enjoy an afternoon filled with snow activities and winter sports for all ages.',
            ar: 'استمتع بفترة ما بعد الظهر المليئة بأنشطة الثلج والرياضات الشتوية لجميع الأعمار.',
        },
        startAt: new Date('2025-12-16T13:00:00.000Z'),
        endAt: new Date('2025-12-16T18:00:00.000Z'),
        originalPrice: 210,
        discountedPrice: 180,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/teal/white.png'],
    },
    // December 18, 2025
    {
        name: {
            en: 'Evening Winter Gala',
            ar: 'حفل الشتاء المسائي',
        },
        description: {
            en: 'An elegant evening winter gala featuring fine dining and live performances.',
            ar: 'حفل شتاء مسائي أنيق يتضمن تناول طعام فاخر وعروضاً حية.',
        },
        startAt: new Date('2025-12-18T17:00:00.000Z'),
        endAt: new Date('2025-12-18T23:00:00.000Z'),
        originalPrice: 300,
        discountedPrice: 250,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/indigo/white.png'],
    },
    // December 20, 2025
    {
        name: {
            en: 'Grand Winter Finale',
            ar: 'الختام الشتوي الكبير',
        },
        description: {
            en: 'The ultimate winter celebration to end the season with spectacular shows and festivities.',
            ar: 'الاحتفال الشتوي النهائي لإنهاء الموسم بعروض واحتفالات مذهلة.',
        },
        startAt: new Date('2025-12-20T10:00:00.000Z'),
        endAt: new Date('2025-12-20T23:59:00.000Z'),
        originalPrice: 350,
        discountedPrice: 280,
        active: true,
        mediaUrls: ['https://placehold.co/600x400/gold/white.png'],
    },
];

export async function seedEvents() {
    console.log('Seeding events...');

    try {
        // Fetch existing locations
        const locations = await prisma.location.findMany();
        if (locations.length === 0) {
            console.error('No locations found. Please seed locations first.');
            return;
        }
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        const locationId = randomLocation.id;

        // Fetch existing categories
        const categories = await prisma.category.findMany();
        if (categories.length === 0) {
            console.error('No categories found. Please seed categories first.');
            return;
        }
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryId = randomCategory.id;

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
                    location: { connect: { id: locationId } },
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
                    location: { connect: { id: locationId } },
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
