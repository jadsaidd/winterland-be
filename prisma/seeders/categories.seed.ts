import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CategoryData {
    title: {
        en: string;
        ar: string;
    };
    description: {
        en: string;
        ar: string;
    };
    active: boolean;
    mediaUrls: string[];
}

export const categoriesData: CategoryData[] = [
    {
        title: {
            en: 'Winter Sports',
            ar: 'الرياضات الشتوية',
        },
        description: {
            en: 'Exciting winter sports activities including skiing, snowboarding, and ice skating',
            ar: 'أنشطة رياضية شتوية مثيرة بما في ذلك التزلج والتزلج على الجليد',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/4A90E2/white.png',
            'https://placehold.co/600x400/5B9BD5/white.png',
        ],
    },
    {
        title: {
            en: 'Ice Adventures',
            ar: 'مغامرات الجليد',
        },
        description: {
            en: 'Thrilling ice adventures and frozen landscape explorations',
            ar: 'مغامرات مثيرة على الجليد واستكشاف المناظر الطبيعية المجمدة',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/50C878/white.png',
            'https://placehold.co/600x400/2ECC71/white.png',
        ],
    },
    {
        title: {
            en: 'Snow Activities',
            ar: 'أنشطة الثلج',
        },
        description: {
            en: 'Fun snow activities for all ages including snowman building and snow fights',
            ar: 'أنشطة ثلجية ممتعة لجميع الأعمار بما في ذلك بناء رجل الثلج ومعارك الثلج',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/E74C3C/white.png',
            'https://placehold.co/600x400/C0392B/white.png',
        ],
    },
    {
        title: {
            en: 'Family Entertainment',
            ar: 'ترفيه عائلي',
        },
        description: {
            en: 'Family-friendly entertainment and activities for everyone',
            ar: 'ترفيه وأنشطة مناسبة للعائلات للجميع',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/9B59B6/white.png',
            'https://placehold.co/600x400/8E44AD/white.png',
        ],
    },
    {
        title: {
            en: 'Adventure Park',
            ar: 'حديقة المغامرات',
        },
        description: {
            en: 'Exciting adventure park with various outdoor activities and challenges',
            ar: 'حديقة مغامرات مثيرة مع أنشطة وتحديات خارجية متنوعة',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/F39C12/white.png',
            'https://placehold.co/600x400/E67E22/white.png',
        ],
    },
    {
        title: {
            en: 'Kids Zone',
            ar: 'منطقة الأطفال',
        },
        description: {
            en: 'Safe and fun zone specially designed for children with supervised activities',
            ar: 'منطقة آمنة وممتعة مصممة خصيصًا للأطفال مع أنشطة خاضعة للإشراف',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/FF6B6B/white.png',
            'https://placehold.co/600x400/FF5252/white.png',
        ],
    },
    {
        title: {
            en: 'Arctic Experience',
            ar: 'تجربة القطب الشمالي',
        },
        description: {
            en: 'Authentic arctic experience with snow houses, ice sculptures, and more',
            ar: 'تجربة قطب شمالي أصيلة مع بيوت ثلجية ومنحوتات جليدية والمزيد',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/1ABC9C/white.png',
            'https://placehold.co/600x400/16A085/white.png',
        ],
    },
    {
        title: {
            en: 'Food & Beverages',
            ar: 'الطعام والمشروبات',
        },
        description: {
            en: 'Delicious food and warm beverages to keep you energized throughout your visit',
            ar: 'طعام لذيذ ومشروبات دافئة لإبقائك نشيطًا طوال زيارتك',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/34495E/white.png',
            'https://placehold.co/600x400/2C3E50/white.png',
        ],
    },
    {
        title: {
            en: 'Photography Spots',
            ar: 'أماكن التصوير',
        },
        description: {
            en: 'Beautiful photography spots with stunning winter backdrops',
            ar: 'أماكن تصوير جميلة مع خلفيات شتوية مذهلة',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/E91E63/white.png',
            'https://placehold.co/600x400/C2185B/white.png',
        ],
    },
    {
        title: {
            en: 'Ice Skating',
            ar: 'التزلج على الجليد',
        },
        description: {
            en: 'Professional ice skating rink with equipment rental available',
            ar: 'حلبة تزلج احترافية على الجليد مع إمكانية استئجار المعدات',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/00BCD4/white.png',
            'https://placehold.co/600x400/0097A7/white.png',
        ],
    },
    {
        title: {
            en: 'Winter Wonderland',
            ar: 'عجائب الشتاء',
        },
        description: {
            en: 'Magical winter wonderland with festive decorations and atmosphere',
            ar: 'عالم شتوي سحري مع زينة واحتفالات مميزة',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/9C27B0/white.png',
            'https://placehold.co/600x400/7B1FA2/white.png',
        ],
    },
    {
        title: {
            en: 'Sledding & Tubing',
            ar: 'التزحلق والأنابيب',
        },
        description: {
            en: 'Thrilling sledding and snow tubing adventures down snowy slopes',
            ar: 'مغامرات مثيرة في التزحلق والأنابيب الثلجية على المنحدرات',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/FF9800/white.png',
            'https://placehold.co/600x400/F57C00/white.png',
        ],
    },
    {
        title: {
            en: 'Gift Shop',
            ar: 'متجر الهدايا',
        },
        description: {
            en: 'Souvenir and gift shop with winter-themed merchandise',
            ar: 'متجر تذكارات وهدايا مع بضائع بطابع شتوي',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/795548/white.png',
            'https://placehold.co/600x400/5D4037/white.png',
        ],
    },
    {
        title: {
            en: 'VIP Lounges',
            ar: 'صالات كبار الشخصيات',
        },
        description: {
            en: 'Exclusive VIP lounges with premium amenities and services',
            ar: 'صالات حصرية لكبار الشخصيات مع وسائل راحة وخدمات متميزة',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/607D8B/white.png',
            'https://placehold.co/600x400/455A64/white.png',
        ],
    },
    {
        title: {
            en: 'Special Events',
            ar: 'فعاليات خاصة',
        },
        description: {
            en: 'Special seasonal events, shows, and performances throughout the year',
            ar: 'فعاليات موسمية خاصة وعروض وأداءات على مدار العام',
        },
        active: true,
        mediaUrls: [
            'https://placehold.co/600x400/FFC107/white.png',
            'https://placehold.co/600x400/FFA000/white.png',
        ],
    },
];

/**
 * Generate URL-friendly slug from English title
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

export async function seedCategories() {
    console.log('Seeding categories...');

    try {
        const createdCategories = [];

        for (const categoryData of categoriesData) {
            const slug = generateSlug(categoryData.title.en);

            // Upsert category
            const category = await prisma.category.upsert({
                where: { categorySlug: slug },
                update: {
                    title: categoryData.title,
                    description: categoryData.description,
                    active: categoryData.active,
                },
                create: {
                    title: categoryData.title,
                    categorySlug: slug,
                    description: categoryData.description,
                    active: categoryData.active,
                },
            });

            // Delete existing media associations
            await prisma.categoryMedia.deleteMany({
                where: { categoryId: category.id },
            });

            // Create and link media
            for (let i = 0; i < categoryData.mediaUrls.length; i++) {
                const mediaUrl = categoryData.mediaUrls[i];

                // Find or create media
                let media = await prisma.media.findFirst({
                    where: { url: mediaUrl },
                });

                if (!media) {
                    media = await prisma.media.create({
                        data: {
                            url: mediaUrl,
                            type: 'IMAGE',
                            context: `Category: ${categoryData.title.en}`,
                        },
                    });
                }

                // Link media to category via pivot table
                await prisma.categoryMedia.create({
                    data: {
                        categoryId: category.id,
                        mediaId: media.id,
                        sortOrder: i + 1,
                    },
                });
            }

            createdCategories.push(category);
            console.log(
                `✓ Category "${categoryData.title.en}" (${slug}) with ${categoryData.mediaUrls.length} media items`
            );
        }

        console.log(`Successfully seeded ${createdCategories.length} categories`);
        return createdCategories;
    } catch (error) {
        console.error('Error seeding categories:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedCategories()
        .then(() => {
            console.log('Categories seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Categories seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
