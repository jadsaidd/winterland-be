/**
 * Response DTO for schedule worker
 */
export interface ScheduleWorkerResponseDto {
    id: string;
    scheduleId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    schedule: {
        id: string;
        startAt: string;
        endAt: string;
        details?: {
            en?: string;
            ar?: string;
        } | null;
        event: {
            id: string;
            name: {
                en: string;
                ar?: string;
            };
            eventSlug: string;
            startAt: string;
            endAt: string;
        };
    };
    user: {
        id: string;
        name: string | null;
        email: string | null;
        phoneNumber: string | null;
        userRoles: Array<{
            role: {
                id: string;
                name: string;
                type: string;
            };
        }>;
    };
}

/**
 * Response DTO for schedule worker statistics
 */
export interface ScheduleWorkerStatisticsResponseDto {
    // Overall counts
    totalAssignments: number;
    uniqueWorkers: number;
    uniqueSchedules: number;
    uniqueEvents: number;

    // Average metrics
    avgWorkersPerSchedule: string;
    avgAssignmentsPerWorker: string;
    avgAssignmentsPerEvent: string;

    // Time-based analytics
    upcomingAssignments: number;
    activeAssignments: number;
    pastAssignments: number;
    todayAssignments: number;

    // Top performers
    topWorkers: Array<{
        userId: string;
        assignmentCount: number;
    }>;
    mostActiveWorkerId: string | null;
    mostActiveWorkerAssignments: number;

    // Event analytics
    mostAssignedEventId: string | null;
    mostAssignedEventCount: number;

    // Distribution metrics
    workloadDistribution: {
        totalWorkers: number;
        averageLoad: string;
        highestLoad: number;
        lowestLoad: number;
    };
}
