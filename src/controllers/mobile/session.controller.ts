import { NextFunction, Request, Response } from 'express';

import { ToggleSeatInput } from '../../schemas/session.schema';
import { SessionService } from '../../services/session.service';

export class SessionController {
    private sessionService = new SessionService();

    /**
     * Create a new session for seat selection
     * POST /api/v1/mobile/sessions
     */
    createSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { eventId, scheduleId } = req.body;
            const userId = req.user.id;

            const result = await this.sessionService.createSession(userId, eventId, scheduleId);

            res.status(result.isExisting ? 200 : 201).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get session by ID with all seat details
     * GET /api/v1/mobile/sessions/:sessionId
     */
    getSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;

            const session = await this.sessionService.getSession(sessionId);

            res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Toggle seat in session (add if not exists, remove if exists)
     * POST /api/v1/mobile/sessions/:sessionId/seats/toggle
     */
    toggleSeat = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const seatData: ToggleSeatInput = req.body;

            const result = await this.sessionService.toggleSeat(sessionId, seatData);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Remove a specific seat from session
     * DELETE /api/v1/mobile/sessions/:sessionId/seats
     */
    removeSeat = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;
            const seatData: ToggleSeatInput = req.body;

            const result = await this.sessionService.removeSeat(sessionId, seatData);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Clear all seats from session
     * DELETE /api/v1/mobile/sessions/:sessionId/seats/all
     */
    clearSessionSeats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;

            const result = await this.sessionService.clearSessionSeats(sessionId);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Cancel session
     * DELETE /api/v1/mobile/sessions/:sessionId
     */
    cancelSession = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { sessionId } = req.params;

            const result = await this.sessionService.cancelSession(sessionId);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
}