import { Prisma } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import { prisma } from '../utils/prisma.client';

export class ScheduleWorkerRepository {
    /**
     * Assign a worker to a schedule
     */
    async create(data: Prisma.ScheduleWorkerCreateInput) {
        return await prisma.scheduleWorker.create({
            data,
            include: {
                schedule: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                startAt: true,
                                endAt: true,
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        userRoles: {
                            include: {
                                role: {
                                    select: {
                                        id: true,
                                        name: true,
                                        roleType: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Find schedule worker by ID
     */
    async findById(id: string) {
        return await prisma.scheduleWorker.findUnique({
            where: { id },
            include: {
                schedule: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                description: true,
                                startAt: true,
                                endAt: true,
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        userRoles: {
                            include: {
                                role: {
                                    select: {
                                        id: true,
                                        name: true,
                                        roleType: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Find all schedule workers with filters and pagination
     */
    async findAll(
        page: number,
        limit: number,
        filters: {
            scheduleId?: string;
            userId?: string;
            eventId?: string;
        }
    ): Promise<PaginatedResponse<any>> {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ScheduleWorkerWhereInput = {};

        if (filters.scheduleId) {
            where.scheduleId = filters.scheduleId;
        }

        if (filters.userId) {
            where.userId = filters.userId;
        }

        if (filters.eventId) {
            where.schedule = {
                eventId: filters.eventId
            };
        }

        const [scheduleWorkers, total] = await Promise.all([
            prisma.scheduleWorker.findMany({
                skip,
                take: limit,
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    schedule: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    eventSlug: true,
                                    startAt: true,
                                    endAt: true,
                                }
                            }
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                            userRoles: {
                                include: {
                                    role: {
                                        select: {
                                            id: true,
                                            name: true,
                                            roleType: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }),
            prisma.scheduleWorker.count({ where })
        ]);

        return createPaginatedResponse(scheduleWorkers, total, page, limit);
    }

    /**
     * Find workers by schedule ID
     */
    async findByScheduleId(scheduleId: string) {
        return await prisma.scheduleWorker.findMany({
            where: { scheduleId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        userRoles: {
                            include: {
                                role: {
                                    select: {
                                        id: true,
                                        name: true,
                                        roleType: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Find schedules by user ID (worker)
     */
    async findByUserId(userId: string) {
        return await prisma.scheduleWorker.findMany({
            where: { userId },
            include: {
                schedule: {
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                eventSlug: true,
                                startAt: true,
                                endAt: true,
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Check if worker is already assigned to schedule
     * Note: This is a UX hint only. For atomic assignment, use assignWorkerIfNotExists.
     */
    async isAssigned(scheduleId: string, userId: string): Promise<boolean> {
        const count = await prisma.scheduleWorker.count({
            where: {
                scheduleId,
                userId
            }
        });
        return count > 0;
    }

    /**
     * Atomically assign a worker to a schedule (race-condition safe)
     * Uses upsert to ensure only one assignment is created even under concurrency.
     * Returns { created: boolean, assignment: ScheduleWorker }
     */
    async assignWorkerIfNotExists(scheduleId: string, userId: string) {
        try {
            // Try to create the assignment
            const assignment = await prisma.scheduleWorker.create({
                data: {
                    schedule: {
                        connect: { id: scheduleId }
                    },
                    user: {
                        connect: { id: userId }
                    }
                },
                include: {
                    schedule: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    name: true,
                                    eventSlug: true,
                                    startAt: true,
                                    endAt: true,
                                }
                            }
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phoneNumber: true,
                            userRoles: {
                                include: {
                                    role: {
                                        select: {
                                            id: true,
                                            name: true,
                                            roleType: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return { created: true, assignment };
        } catch (error: any) {
            // Check for unique constraint violation (P2002)
            if (error.code === 'P2002') {
                // Assignment already exists, fetch and return it
                const existingAssignment = await prisma.scheduleWorker.findFirst({
                    where: {
                        scheduleId,
                        userId
                    },
                    include: {
                        schedule: {
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        name: true,
                                        eventSlug: true,
                                        startAt: true,
                                        endAt: true,
                                    }
                                }
                            }
                        },
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phoneNumber: true,
                                userRoles: {
                                    include: {
                                        role: {
                                            select: {
                                                id: true,
                                                name: true,
                                                roleType: true,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                return { created: false, assignment: existingAssignment };
            }
            // Re-throw other errors
            throw error;
        }
    }

    /**
     * Remove worker from schedule
     */
    async delete(id: string) {
        return await prisma.scheduleWorker.delete({
            where: { id }
        });
    }

    /**
     * Remove worker from schedule by scheduleId and userId
     */
    async deleteByScheduleAndUser(scheduleId: string, userId: string) {
        return await prisma.scheduleWorker.deleteMany({
            where: {
                scheduleId,
                userId
            }
        });
    }

    /**
     * Check if schedule worker exists
     */
    async exists(id: string): Promise<boolean> {
        const count = await prisma.scheduleWorker.count({
            where: { id }
        });
        return count > 0;
    }

    /**
     * Get schedule workers statistics
     */
    async getStatistics() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        const [
            totalAssignments,
            uniqueWorkers,
            uniqueSchedules,
            uniqueEvents,
            workersGroupedByUser,
            schedulesGroupedByEvent,
            upcomingAssignments,
            activeAssignments,
            pastAssignments,
            todayAssignments,
        ] = await Promise.all([
            // Basic counts
            prisma.scheduleWorker.count(),
            prisma.scheduleWorker.groupBy({
                by: ['userId'],
            }).then((result: any) => result.length),
            prisma.scheduleWorker.groupBy({
                by: ['scheduleId'],
            }).then((result: any) => result.length),

            // Unique events with worker assignments
            prisma.scheduleWorker.findMany({
                select: {
                    schedule: {
                        select: {
                            eventId: true
                        }
                    }
                },
                distinct: ['scheduleId']
            }).then((results: any) => {
                const uniqueEventIds = new Set(results.map((r: any) => r.schedule.eventId));
                return uniqueEventIds.size;
            }),

            // Workers grouped by user (for top workers)
            prisma.scheduleWorker.groupBy({
                by: ['userId'],
                _count: {
                    id: true
                },
                orderBy: {
                    _count: {
                        id: 'desc'
                    }
                },
                take: 5
            }),

            // Schedules grouped by event
            prisma.scheduleWorker.findMany({
                select: {
                    schedule: {
                        select: {
                            eventId: true
                        }
                    }
                }
            }).then((results: any) => {
                const eventCounts = new Map<string, number>();
                results.forEach((r: any) => {
                    const eventId = r.schedule.eventId;
                    eventCounts.set(eventId, (eventCounts.get(eventId) || 0) + 1);
                });
                return Array.from(eventCounts.entries())
                    .map(([eventId, count]) => ({ eventId, count }))
                    .sort((a, b) => b.count - a.count);
            }),

            // Time-based assignments
            prisma.scheduleWorker.count({
                where: {
                    schedule: {
                        startAt: {
                            gte: now
                        }
                    }
                }
            }),
            prisma.scheduleWorker.count({
                where: {
                    schedule: {
                        startAt: {
                            lte: now
                        },
                        endAt: {
                            gte: now
                        }
                    }
                }
            }),
            prisma.scheduleWorker.count({
                where: {
                    schedule: {
                        endAt: {
                            lt: now
                        }
                    }
                }
            }),
            prisma.scheduleWorker.count({
                where: {
                    schedule: {
                        OR: [
                            {
                                startAt: {
                                    gte: startOfToday,
                                    lt: endOfToday
                                }
                            },
                            {
                                AND: [
                                    { startAt: { lte: startOfToday } },
                                    { endAt: { gte: endOfToday } }
                                ]
                            }
                        ]
                    }
                }
            }),
        ]);

        // Calculate averages and rates
        const avgWorkersPerSchedule = uniqueSchedules > 0
            ? (totalAssignments / uniqueSchedules).toFixed(2)
            : '0.00';

        const avgAssignmentsPerWorker = uniqueWorkers > 0
            ? (totalAssignments / uniqueWorkers).toFixed(2)
            : '0.00';

        const avgAssignmentsPerEvent = uniqueEvents > 0
            ? (totalAssignments / uniqueEvents).toFixed(2)
            : '0.00';

        // Top workers data
        const topWorkers = workersGroupedByUser.map((worker: any) => ({
            userId: worker.userId,
            assignmentCount: worker._count.id
        }));

        // Most assigned event
        const mostAssignedEvent = schedulesGroupedByEvent.length > 0
            ? schedulesGroupedByEvent[0]
            : null;

        return {
            // Overall counts
            totalAssignments,
            uniqueWorkers,
            uniqueSchedules,
            uniqueEvents,

            // Average metrics
            avgWorkersPerSchedule,
            avgAssignmentsPerWorker,
            avgAssignmentsPerEvent,

            // Time-based analytics
            upcomingAssignments,
            activeAssignments,
            pastAssignments,
            todayAssignments,

            // Top performers
            topWorkers,
            mostActiveWorkerId: topWorkers.length > 0 ? topWorkers[0].userId : null,
            mostActiveWorkerAssignments: topWorkers.length > 0 ? topWorkers[0].assignmentCount : 0,

            // Event analytics
            mostAssignedEventId: mostAssignedEvent?.eventId || null,
            mostAssignedEventCount: mostAssignedEvent?.count || 0,

            // Distribution metrics
            workloadDistribution: {
                totalWorkers: uniqueWorkers,
                averageLoad: avgAssignmentsPerWorker,
                highestLoad: topWorkers.length > 0 ? topWorkers[0].assignmentCount : 0,
                lowestLoad: topWorkers.length > 0 ? topWorkers[topWorkers.length - 1].assignmentCount : 0,
            },
        };
    }

    /**
     * Get worker assignments count
     */
    async getWorkerAssignmentsCount(userId: string): Promise<number> {
        return await prisma.scheduleWorker.count({
            where: { userId }
        });
    }

    /**
     * Get schedule workers count
     */
    async getScheduleWorkersCount(scheduleId: string): Promise<number> {
        return await prisma.scheduleWorker.count({
            where: { scheduleId }
        });
    }
}

export const scheduleWorkerRepository = new ScheduleWorkerRepository();
