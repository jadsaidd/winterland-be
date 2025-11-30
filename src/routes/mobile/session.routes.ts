import { Router } from 'express';

import { SessionController } from '../../controllers/mobile/session.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
    cancelSessionParamSchema,
    createSessionSchema,
    sessionIdParamSchema,
    toggleSeatSchema,
} from '../../schemas/session.schema';

const router = Router();
const sessionController = new SessionController();

/**
 * @route   POST /api/v1/mobile/sessions
 * @desc    Create a new session for seat selection
 * @access  Private (authenticated users)
 * @body    { eventId: string, scheduleId: string }
 * @returns { session, sessionUrl, isExisting }
 * 
 * Note: If user already has a pending session for this event+schedule,
 * returns the existing session instead of creating a new one.
 */
router.post(
    '/',
    authMiddleware,
    validate(createSessionSchema),
    sessionController.createSession
);

/**
 * @route   GET /api/v1/mobile/sessions/:sessionId
 * @desc    Get session by ID with all seat details
 * @access  Public
 * @params  sessionId: string
 * @returns Session details with seats, pricing, and totals
 */
router.get(
    '/:sessionId',
    validate(sessionIdParamSchema, 'params'),
    sessionController.getSession
);

/**
 * @route   POST /api/v1/mobile/sessions/:sessionId/seats/toggle
 * @desc    Toggle a seat in session (add if not exists, remove if exists)
 * @access  Public
 * @params  sessionId: string
 * @body    { sectionPosition: CENTER|LEFT|RIGHT, zoneType: VVIP|VIP|REGULAR|ECONOMY, rowNumber: number, seatNumber: number }
 * @returns { action: 'added'|'removed', seat: {...} }
 * 
 * Validations:
 * - Session must be pending
 * - Seat must exist in event's location
 * - Seat must not be already booked (in BookingSeat)
 */
router.post(
    '/:sessionId/seats/toggle',
    validate(sessionIdParamSchema, 'params'),
    validate(toggleSeatSchema),
    sessionController.toggleSeat
);

/**
 * @route   DELETE /api/v1/mobile/sessions/:sessionId/seats
 * @desc    Remove a specific seat from session
 * @access  Public
 * @params  sessionId: string
 * @body    { sectionPosition: CENTER|LEFT|RIGHT, zoneType: VVIP|VIP|REGULAR|ECONOMY, rowNumber: number, seatNumber: number }
 */
router.delete(
    '/:sessionId/seats',
    validate(sessionIdParamSchema, 'params'),
    validate(toggleSeatSchema),
    sessionController.removeSeat
);

/**
 * @route   DELETE /api/v1/mobile/sessions/:sessionId/seats/all
 * @desc    Clear all seats from session (keeps session active)
 * @access  Public
 * @params  sessionId: string
 */
router.delete(
    '/:sessionId/seats/all',
    validate(sessionIdParamSchema, 'params'),
    sessionController.clearSessionSeats
);

/**
 * @route   DELETE /api/v1/mobile/sessions/:sessionId
 * @desc    Cancel session and clear all seats
 * @access  Public
 * @params  sessionId: string
 */
router.delete(
    '/:sessionId',
    validate(cancelSessionParamSchema, 'params'),
    sessionController.cancelSession
);

export default router;