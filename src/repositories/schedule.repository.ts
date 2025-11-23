import { Prisma } from '@prisma/client';

import { createPaginatedResponse, PaginatedResponse } from '../utils/pagination.util';
import { prisma } from '../utils/prisma.client';

export class ScheduleRepository {
    /**
     * Create a new schedule
     */
    async create(data: Prisma.ScheduleCreateInput) {
        return await prisma.schedule.create({
            data,
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        startAt: true,
                        endAt: true,
                    }
                },
                scheduleWorkers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phoneNumber: true,
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Find schedule by ID
     */
    async findById(id: string) {
        return await prisma.schedule.findUnique({
            where: { id },
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        description: true,
                        startAt: true,
                        endAt: true,
                        active: true,
                    }
                },
                scheduleWorkers: {
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
                }
            }
        });
    }

    /**
     * Find all schedules with filters and pagination
     */
    async findAll(
        page: number,
        limit: number,
        filters: {
            eventId?: string;
            startDate?: Date;
            endDate?: Date;
            hasWorkers?: boolean;
        }
    ): Promise<PaginatedResponse<any>> {
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ScheduleWhereInput = {};

        if (filters.eventId) {
            where.eventId = filters.eventId;
        }

        if (filters.startDate || filters.endDate) {
            where.AND = [];

            if (filters.startDate) {
                where.AND.push({
                    startAt: {
                        gte: filters.startDate,
                    }
                });
            }

            if (filters.endDate) {
                where.AND.push({
                    endAt: {
                        lte: filters.endDate,
                    }
                });
            }
        }

        if (filters.hasWorkers !== undefined) {
            if (filters.hasWorkers) {
                where.scheduleWorkers = {
                    some: {}
                };
            } else {
                where.scheduleWorkers = {
                    none: {}
                };
            }
        }

        const [schedules, total] = await Promise.all([
            prisma.schedule.findMany({
                skip,
                take: limit,
                where,
                orderBy: { startAt: 'asc' },
                include: {
                    event: {
                        select: {
                            id: true,
                            name: true,
                            eventSlug: true,
                            startAt: true,
                            endAt: true,
                            active: true,
                        }
                    },
                    scheduleWorkers: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phoneNumber: true,
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            scheduleWorkers: true
                        }
                    }
                }
            }),
            prisma.schedule.count({ where })
        ]);

        return createPaginatedResponse(schedules, total, page, limit);
    }

    /**
     * Update schedule by ID
     */
    async update(id: string, data: Prisma.ScheduleUpdateInput) {
        return await prisma.schedule.update({
            where: { id },
            data,
            include: {
                event: {
                    select: {
                        id: true,
                        name: true,
                        eventSlug: true,
                        startAt: true,
                        endAt: true,
                    }
                },
                scheduleWorkers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phoneNumber: true,
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Delete schedule by ID
     */
    async delete(id: string) {
        return await prisma.schedule.delete({
            where: { id }
        });
    }

    /**
     * Check if schedule exists
     */
    async exists(id: string): Promise<boolean> {
        const count = await prisma.schedule.count({
            where: { id }
        });
        return count > 0;
    }

    /**
     * Find schedules by event ID
     */
    async findByEventId(eventId: string) {
        return await prisma.schedule.findMany({
            where: { eventId },
            orderBy: { startAt: 'asc' },
            include: {
                scheduleWorkers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phoneNumber: true,
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Check if schedules overlap for the same event
     */
    async hasOverlap(eventId: string, startAt: Date, endAt: Date, excludeScheduleId?: string): Promise<boolean> {
        const where: Prisma.ScheduleWhereInput = {
            eventId,
            OR: [
                // New schedule starts during existing schedule
                {
                    AND: [
                        { startAt: { lte: startAt } },
                        { endAt: { gt: startAt } }
                    ]
                },
                // New schedule ends during existing schedule
                {
                    AND: [
                        { startAt: { lt: endAt } },
                        { endAt: { gte: endAt } }
                    ]
                },
                // New schedule completely contains existing schedule
                {
                    AND: [
                        { startAt: { gte: startAt } },
                        { endAt: { lte: endAt } }
                    ]
                }
            ]
        };

        if (excludeScheduleId) {
            where.id = { not: excludeScheduleId };
        }

        const count = await prisma.schedule.count({ where });
        return count > 0;
    }

    /**
     * Get schedules statistics
     */
    async getStatistics() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const [
            totalSchedules,
            schedulesWithWorkers,
            upcomingSchedules,
            pastSchedules,
            activeSchedules,
            todaySchedules,
            thisWeekSchedules,
            schedulesGroupedByEvent,
            avgWorkersPerSchedule,
            totalWorkerAssignments,
            schedulesFullyStaffed,
        ] = await Promise.all([
            // Basic counts
            prisma.schedule.count(),
            prisma.schedule.count({
                where: {
                    scheduleWorkers: {
                        some: {}
                    }
                }
            }),

            // Time-based counts
            prisma.schedule.count({
                where: {
                    startAt: {
                        gte: now
                    }
                }
            }),
            prisma.schedule.count({
                where: {
                    endAt: {
                        lt: now
                    }
                }
            }),
            prisma.schedule.count({
                where: {
                    startAt: {
                        lte: now
                    },
                    endAt: {
                        gte: now
                    }
                }
            }),

            // Today's schedules
            prisma.schedule.count({
                where: {
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
            }),

            // This week's schedules
            prisma.schedule.count({
                where: {
                    OR: [
                        {
                            startAt: {
                                gte: startOfWeek,
                                lt: endOfWeek
                            }
                        },
                        {
                            AND: [
                                { startAt: { lte: startOfWeek } },
                                { endAt: { gte: endOfWeek } }
                            ]
                        }
                    ]
                }
            }),

            // Schedules grouped by event
            prisma.schedule.groupBy({
                by: ['eventId'],
                _count: {
                    id: true
                }
            }),

            // Average workers per schedule
            prisma.scheduleWorker.groupBy({
                by: ['scheduleId'],
                _count: {
                    id: true
                }
            }).then((groups: any) => {
                if (groups.length === 0) return 0;
                const totalWorkers = groups.reduce((sum: number, group: any) => sum + group._count.id, 0);
                return (totalWorkers / groups.length).toFixed(2);
            }),

            // Total worker assignments
            prisma.scheduleWorker.count(),

            // Schedules with 3 or more workers (considered fully staffed)
            prisma.schedule.count({
                where: {
                    scheduleWorkers: {
                        // Note: This counts schedules with at least 1 worker
                        // We'll need to filter in code for 3+ workers
                        some: {}
                    }
                }
            }).then(async () => {
                // Get actual count of schedules with 3+ workers
                const schedules = await prisma.schedule.findMany({
                    select: {
                        id: true,
                        _count: {
                            select: {
                                scheduleWorkers: true
                            }
                        }
                    }
                });
                return schedules.filter((s: any) => s._count.scheduleWorkers >= 3).length;
            }),
        ]);

        // Calculate event-based statistics
        const uniqueEvents = schedulesGroupedByEvent.length;
        const avgSchedulesPerEvent = uniqueEvents > 0
            ? (totalSchedules / uniqueEvents).toFixed(2)
            : '0.00';

        const mostScheduledEvent = schedulesGroupedByEvent.length > 0
            ? schedulesGroupedByEvent.reduce((max: any, current: any) =>
                current._count.id > max._count.id ? current : max
            )
            : null;

        return {
            // Overall counts
            totalSchedules,
            schedulesWithWorkers,
            schedulesWithoutWorkers: totalSchedules - schedulesWithWorkers,

            // Time-based analytics
            upcomingSchedules,
            pastSchedules,
            activeSchedules,
            todaySchedules,
            thisWeekSchedules,

            // Event-based analytics
            uniqueEvents,
            avgSchedulesPerEvent,
            mostScheduledEventId: mostScheduledEvent?.eventId || null,
            mostScheduledEventCount: mostScheduledEvent?._count.id || 0,

            // Worker analytics
            totalWorkerAssignments,
            avgWorkersPerSchedule,
            schedulesFullyStaffed,
            schedulesUnderStaffed: schedulesWithWorkers - schedulesFullyStaffed,

            // Capacity metrics
            staffingRate: totalSchedules > 0
                ? ((schedulesWithWorkers / totalSchedules) * 100).toFixed(2) + '%'
                : '0.00%',
            fullyStaffedRate: schedulesWithWorkers > 0
                ? ((schedulesFullyStaffed / schedulesWithWorkers) * 100).toFixed(2) + '%'
                : '0.00%',
        };
    }
}

export const scheduleRepository = new ScheduleRepository();
