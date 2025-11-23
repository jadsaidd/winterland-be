import { NextFunction, Request, Response } from 'express';

import { scheduleService } from '../../services/schedule.service';

export class DashboardScheduleController {
    /**
     * Create a new schedule
     */
    async createSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const schedule = await scheduleService.createSchedule(req.body);

            res.status(201).json({
                success: true,
                message: 'Schedule created successfully',
                data: schedule,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all schedules with filters and pagination
     */
    async getAllSchedules(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit } = (req as any).pagination;
            const result = await scheduleService.getAllSchedules(
                page,
                limit,
                req.query
            );

            res.status(200).json({
                success: true,
                message: 'Schedules retrieved successfully',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get schedule by ID
     */
    async getScheduleById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const schedule = await scheduleService.getScheduleById(id);

            res.status(200).json({
                success: true,
                message: 'Schedule retrieved successfully',
                data: schedule,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update schedule
     */
    async updateSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const schedule = await scheduleService.updateSchedule(id, req.body);

            res.status(200).json({
                success: true,
                message: 'Schedule updated successfully',
                data: schedule,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete schedule
     */
    async deleteSchedule(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await scheduleService.deleteSchedule(id);

            res.status(200).json({
                success: true,
                message: 'Schedule deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get schedules by event ID
     */
    async getSchedulesByEventId(req: Request, res: Response, next: NextFunction) {
        try {
            const { eventId } = req.params;
            const schedules = await scheduleService.getSchedulesByEventId(eventId);

            res.status(200).json({
                success: true,
                message: 'Event schedules retrieved successfully',
                data: schedules,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get schedules statistics
     */
    async getStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const statistics = await scheduleService.getStatistics();

            res.status(200).json({
                success: true,
                message: 'Schedule statistics retrieved successfully',
                data: statistics,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardScheduleController = new DashboardScheduleController();
