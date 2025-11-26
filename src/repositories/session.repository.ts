import prisma from '../utils/prisma.client';

export class SessionRepository {
    async create(data: { userId: string; eventId: string; scheduleId: string; code: string }) {
        return prisma.session.create({
            data,
        });
    }

    async generateUniqueCode(): Promise<string> {
        const crypto = await import('crypto');
        let code: string;
        let exists: boolean;
        do {
            code = crypto.randomBytes(12).toString('hex').toUpperCase();
            exists = await prisma.session.findUnique({ where: { code } }) !== null;
        } while (exists);
        return code;
    }

    async findEventWithSchedules(eventId: string) {
        return prisma.event.findUnique({
            where: { id: eventId },
            include: {
                schedules: {
                    select: { id: true },
                },
            },
        });
    }
}