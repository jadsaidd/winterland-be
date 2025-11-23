/**
 * Response DTO for schedule
 */
export interface ScheduleResponseDto {
    id: string;
    startAt: string;
    endAt: string;
    details?: {
        en?: string;
        ar?: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    eventId: string;
    event: {
        id: string;
        name: {
            en: string;
            ar?: string;
        };
        eventSlug: string;
        startAt: string;
        endAt: string;
        active?: boolean;
    };
    scheduleWorkers: Array<{
        id: string;
        userId: string;
        user: {
            id: string;
            name: string | null;
            email: string | null;
            phoneNumber: string | null;
        };
    }>;
    _count?: {
        scheduleWorkers: number;
    };
}

/**
 * Response DTO for schedule statistics
 */
export interface ScheduleStatisticsResponseDto {
    // Overall counts
    totalSchedules: number;
    schedulesWithWorkers: number;
    schedulesWithoutWorkers: number;

    // Time-based analytics
    upcomingSchedules: number;
    pastSchedules: number;
    activeSchedules: number;
    todaySchedules: number;
    thisWeekSchedules: number;

    // Event-based analytics
    uniqueEvents: number;
    avgSchedulesPerEvent: string;
    mostScheduledEventId: string | null;
    mostScheduledEventCount: number;

    // Worker analytics
    totalWorkerAssignments: number;
    avgWorkersPerSchedule: string;
    schedulesFullyStaffed: number;
    schedulesUnderStaffed: number;

    // Capacity metrics
    staffingRate: string;
    fullyStaffedRate: string;
}
