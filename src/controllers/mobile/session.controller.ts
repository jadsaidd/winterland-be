import { NextFunction, Request, Response } from 'express';

import { SessionService } from '../../services/session.service';

export class SessionController {
    private sessionService = new SessionService();

    async createSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { eventId, scheduleId } = req.body;
            const userId = req.user.id;

            const session = await this.sessionService.createSession(userId, eventId, scheduleId);

            res.status(201).json({
                success: true,
                data: session,
            });
        } catch (error) {
            next(error);
        }
    }
}