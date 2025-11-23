/**
 * Request DTO for assigning a worker to a schedule
 */
export interface CreateScheduleWorkerDto {
    scheduleId: string;
    userId: string;
}

/**
 * Query parameters for getting all schedule workers
 */
export interface GetAllScheduleWorkersQueryDto {
    page?: string;
    limit?: string;
    scheduleId?: string;
    userId?: string;
    eventId?: string;
}
