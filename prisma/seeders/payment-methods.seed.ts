import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentMethodData {
    name: {
        en: string;
        ar: string;
    };
    description: {
        en: string;
        ar: string;
    };
    isActive: boolean;
    mediaUrl: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'BANNER' | 'OTHER';
}

export const paymentMethodsData: PaymentMethodData[] = [
    {
        name: {
            en: 'Cash',
            ar: 'نقدي',
        },
        description: {
            en: 'Pay with cash at the venue',
            ar: 'الدفع نقداً في الموقع',
        },
        isActive: true,
        mediaUrl: 'https://www.svgrepo.com/show/308983/cash-payment-pay-money-cash.svg',
        mediaType: 'IMAGE',
    },
    {
        name: {
            en: 'Ziina',
            ar: 'زينة',
        },
        description: {
            en: 'Secure electronic payment through Ziina',
            ar: 'دفع إلكتروني آمن عبر زينة',
        },
        isActive: true,
        mediaUrl: 'https://play-lh.googleusercontent.com/RlMpy5s5o8DUDmLXQ2bZklnunIAEazncahxRyFUNys1D6vbULPgODamq7axhhWbsWJE',
        mediaType: 'IMAGE',
    },
    {
        name: {
            en: 'Card',
            ar: 'بطاقة',
        },
        description: {
            en: 'Pay using your credit or debit card',
            ar: 'الدفع باستخدام بطاقتك الائتمانية أو بطاقة الخصم',
        },
        isActive: true,
        mediaUrl: 'https://www.svgrepo.com/show/447722/online-payment.svg',
        mediaType: 'IMAGE',
    },
];

export async function seedPaymentMethods() {
    console.log('Seeding payment methods...');

    try {
        const createdPaymentMethods = [];

        for (const paymentMethodData of paymentMethodsData) {
            // First, find or create the media for the payment method icon
            let media = await prisma.media.findFirst({
                where: {
                    url: paymentMethodData.mediaUrl,
                },
            });

            if (!media) {
                media = await prisma.media.create({
                    data: {
                        url: paymentMethodData.mediaUrl,
                        type: paymentMethodData.mediaType,
                        context: `Icon for ${paymentMethodData.name.en} payment method`,
                        uploadedBy: null,
                    },
                });
            }

            // Find existing payment method by the JSON `name` object (if present),
            // otherwise create a new payment method and let Prisma generate the `id` (cuid).
            let paymentMethod = await prisma.paymentMethod.findFirst({
                where: {
                    name: { equals: paymentMethodData.name },
                },
            });

            if (paymentMethod) {
                paymentMethod = await prisma.paymentMethod.update({
                    where: { id: paymentMethod.id },
                    data: {
                        name: paymentMethodData.name,
                        description: paymentMethodData.description,
                        isActive: paymentMethodData.isActive,
                    },
                });
            } else {
                paymentMethod = await prisma.paymentMethod.create({
                    data: {
                        name: paymentMethodData.name,
                        description: paymentMethodData.description,
                        isActive: paymentMethodData.isActive,
                    },
                });
            }

            // Check if the media is already associated with the payment method
            const existingAssociation = await prisma.paymentMethodMedia.findUnique({
                where: {
                    paymentMethodId_mediaId: {
                        paymentMethodId: paymentMethod.id,
                        mediaId: media.id,
                    },
                },
            });

            // Create the association if it doesn't exist
            if (!existingAssociation) {
                await prisma.paymentMethodMedia.create({
                    data: {
                        paymentMethodId: paymentMethod.id,
                        mediaId: media.id,
                        sortOrder: 1,
                    },
                });
            }

            createdPaymentMethods.push(paymentMethod);
            console.log(`Payment method "${paymentMethodData.name.en}" seeded`);
        }

        console.log(`Successfully seeded ${createdPaymentMethods.length} payment methods`);
        return createdPaymentMethods;
    } catch (error) {
        console.error('Error seeding payment methods:', error);
        throw error;
    }
}

// Allow running this seeder independently
if (require.main === module) {
    seedPaymentMethods()
        .then(() => {
            console.log('Payment methods seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Payment methods seeding failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
