import { RoleType } from '@prisma/client';

import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '../exceptions/http.exception';
import { scheduleRepository } from '../repositories/schedule.repository';
import { scheduleWorkerRepository } from '../repositories/schedule-worker.repository';
import { UserRepository } from '../repositories/user.repository';
import {
    CreateScheduleWorkerInput,
    GetAllScheduleWorkersQuery,
} from '../schemas/schedule-worker.schema';

const userRepository = new UserRepository();

export class ScheduleWorkerService {
    /**
     * Assign a worker to a schedule
     * 
     * Uses atomic repository method to prevent race conditions.
     * The database enforces a unique constraint on (scheduleId, userId),
     * and the repository method handles concurrent assignments gracefully.
     */
    async assignWorkerToSchedule(data: CreateScheduleWorkerInput) {
        const { scheduleId, userId } = data;

        // 1. Validate schedule exists
        const schedule = await scheduleRepository.findById(scheduleId);
        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        // 2. Validate user exists
        const user = await userRepository.findByIdWithRolesAndPermissions(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 3. Validate user has a WORKER role
        const hasWorkerRole = user.userRoles.some(
            (userRole: any) => userRole.role.roleType === RoleType.WORKER
        );

        if (!hasWorkerRole) {
            throw new BadRequestException(
                'User must have a WORKER role to be assigned to a schedule'
            );
        }

        // 4. Atomically assign worker to schedule (race-condition safe)
        // Uses the repository's atomic method which handles the DB unique constraint
        const { created, assignment } = await scheduleWorkerRepository.assignWorkerIfNotExists(
            scheduleId,
            userId
        );

        // If assignment already existed, throw ConflictException
        if (!created) {
            throw new ConflictException(
                'Worker is already assigned to this schedule'
            );
        }

        return assignment;
    }

    /**
     * Get all schedule workers with filters and pagination
     */
    async getAllScheduleWorkers(
        page: number,
        limit: number,
        query: GetAllScheduleWorkersQuery
    ) {
        const filters: any = {};

        if (query.scheduleId) {
            filters.scheduleId = query.scheduleId;
        }

        if (query.userId) {
            filters.userId = query.userId;
        }

        if (query.eventId) {
            filters.eventId = query.eventId;
        }

        return await scheduleWorkerRepository.findAll(page, limit, filters);
    }

    /**
     * Get schedule worker by ID
     */
    async getScheduleWorkerById(id: string) {
        const scheduleWorker = await scheduleWorkerRepository.findById(id);

        if (!scheduleWorker) {
            throw new NotFoundException('Schedule worker assignment not found');
        }

        return scheduleWorker;
    }

    /**
     * Get workers by schedule ID
     */
    async getWorkersByScheduleId(scheduleId: string) {
        // Validate schedule exists
        const schedule = await scheduleRepository.findById(scheduleId);
        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        return await scheduleWorkerRepository.findByScheduleId(scheduleId);
    }

    /**
     * Get schedules by user ID (worker)
     */
    async getSchedulesByUserId(userId: string) {
        // Validate user exists
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return await scheduleWorkerRepository.findByUserId(userId);
    }

    /**
     * Remove worker from schedule by assignment ID
     */
    async removeWorkerFromSchedule(id: string) {
        const scheduleWorker = await scheduleWorkerRepository.findById(id);

        if (!scheduleWorker) {
            throw new NotFoundException('Schedule worker assignment not found');
        }

        await scheduleWorkerRepository.delete(id);

        return { message: 'Worker removed from schedule successfully' };
    }

    /**
     * Remove worker from schedule by scheduleId and userId
     */
    async removeWorkerByScheduleAndUser(scheduleId: string, userId: string) {
        // 1. Validate schedule exists
        const schedule = await scheduleRepository.findById(scheduleId);
        if (!schedule) {
            throw new NotFoundException('Schedule not found');
        }

        // 2. Validate user exists
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 3. Check if worker is assigned
        const isAssigned = await scheduleWorkerRepository.isAssigned(
            scheduleId,
            userId
        );

        if (!isAssigned) {
            throw new NotFoundException(
                'Worker is not assigned to this schedule'
            );
        }

        // 4. Remove the assignment
        await scheduleWorkerRepository.deleteByScheduleAndUser(
            scheduleId,
            userId
        );

        return { message: 'Worker removed from schedule successfully' };
    }

    /**
     * Get schedule workers statistics
     */
    async getStatistics() {
        return await scheduleWorkerRepository.getStatistics();
    }
}

export const scheduleWorkerService = new ScheduleWorkerService();
