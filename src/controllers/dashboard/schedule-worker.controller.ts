import { NextFunction, Request, Response } from 'express';

import { scheduleWorkerService } from '../../services/schedule-worker.service';

export class DashboardScheduleWorkerController {
    /**
     * Assign a worker to a schedule
     */
    async assignWorkerToSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const scheduleWorker = await scheduleWorkerService.assignWorkerToSchedule(req.body);

            res.status(201).json({
                success: true,
                message: 'Worker assigned to schedule successfully',
                data: scheduleWorker,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all schedule workers with filters and pagination
     */
    async getAllScheduleWorkers(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const result = await scheduleWorkerService.getAllScheduleWorkers(
                page,
                limit,
                req.query
            );

            res.status(200).json({
                success: true,
                message: 'Schedule workers retrieved successfully',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get schedule worker by ID
     */
    async getScheduleWorkerById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const scheduleWorker = await scheduleWorkerService.getScheduleWorkerById(id);

            res.status(200).json({
                success: true,
                message: 'Schedule worker retrieved successfully',
                data: scheduleWorker,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get workers by schedule ID
     */
    async getWorkersByScheduleId(req: Request, res: Response, next: NextFunction) {
        try {
            const { scheduleId } = req.params;
            const workers = await scheduleWorkerService.getWorkersByScheduleId(scheduleId);

            res.status(200).json({
                success: true,
                message: 'Schedule workers retrieved successfully',
                data: workers,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get schedules by user ID (worker)
     */
    async getSchedulesByUserId(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const schedules = await scheduleWorkerService.getSchedulesByUserId(userId);

            res.status(200).json({
                success: true,
                message: 'Worker schedules retrieved successfully',
                data: schedules,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove worker from schedule by assignment ID
     */
    async removeWorkerFromSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await scheduleWorkerService.removeWorkerFromSchedule(id);

            res.status(200).json({
                success: true,
                message: 'Worker removed from schedule successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Remove worker from schedule by scheduleId and userId
     */
    async removeWorkerByScheduleAndUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { scheduleId, userId } = req.params;
            await scheduleWorkerService.removeWorkerByScheduleAndUser(scheduleId, userId);

            res.status(200).json({
                success: true,
                message: 'Worker removed from schedule successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get schedule workers statistics
     */
    async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const statistics = await scheduleWorkerService.getStatistics();

            res.status(200).json({
                success: true,
                message: 'Schedule worker statistics retrieved successfully',
                data: statistics,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardScheduleWorkerController = new DashboardScheduleWorkerController();
