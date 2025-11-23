/**
 * Request DTO for creating a schedule
 */
export interface CreateScheduleDto {
    eventId: string;
    startAt: string;
    endAt: string;
    details?: {
        en?: string;
        ar?: string;
    };
}

/**
 * Request DTO for updating a schedule
 */
export interface UpdateScheduleDto {
    startAt?: string;
    endAt?: string;
    details?: {
        en?: string;
        ar?: string;
    };
}

/**
 * Query parameters for getting all schedules
 */
export interface GetAllSchedulesQueryDto {
    page?: string;
    limit?: string;
    eventId?: string;
    startDate?: string;
    endDate?: string;
    hasWorkers?: 'true' | 'false';
}
