import { Router } from 'express';

import { dashboardSeatSelectionController } from '../../controllers/dashboard/seat-selection.controller';
import { authMiddleware, permissionMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { checkAvailabilityBodySchema, checkAvailabilityParamsSchema, getReservedSeatsParamsSchema, getRowsParamsSchema, getSeatMapParamsSchema, getSeatsParamsSchema, getSectionsParamsSchema, getZonesParamsSchema, validateSeatsBodySchema } from '../../schemas/seat-selection.schema';

const router = Router();

/**
 * Dashboard Seat Selection Routes
 * Provides hierarchical seat selection for admin booking
 * 
 * Flow: Schedule → Zones → Sections → Rows → Seats
 * 
 * All routes require authentication and bookings:read permission
 */

/**
 * @route   GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/zones
 * @desc    Get all zones for a schedule with availability summary
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * First level of seat selection hierarchy
 * Returns zones with pricing and seat availability counts
 */
router.get(
    '/schedules/:scheduleId/zones',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(getZonesParamsSchema, 'params'),
    dashboardSeatSelectionController.getZones
);

/**
 * @route   GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/zones/:locationZoneId/sections
 * @desc    Get sections for a specific zone with availability
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * Second level - sections within a zone
 * Returns sections with row counts and availability
 */
router.get(
    '/schedules/:scheduleId/zones/:locationZoneId/sections',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(getSectionsParamsSchema, 'params'),
    dashboardSeatSelectionController.getSections
);

/**
 * @route   GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/sections/:sectionId/rows
 * @desc    Get rows for a specific section with seat availability
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * Third level - rows within a section
 * Returns rows with individual seat availability (includes seats array)
 */
router.get(
    '/schedules/:scheduleId/sections/:sectionId/rows',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(getRowsParamsSchema, 'params'),
    dashboardSeatSelectionController.getRows
);

/**
 * @route   GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/rows/:rowId/seats
 * @desc    Get seats for a specific row with availability
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * Fourth (final) level - individual seats
 * Returns seats with detailed info and availability status
 */
router.get(
    '/schedules/:scheduleId/rows/:rowId/seats',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(getSeatsParamsSchema, 'params'),
    dashboardSeatSelectionController.getSeats
);

/**
 * @route   GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/seat-map
 * @desc    Get complete seat map for a schedule
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * Returns full hierarchy in one call: Zones → Sections → Rows → Seats
 * Useful for rendering complete seat map UI
 * Note: May return large payload for venues with many seats
 */
router.get(
    '/schedules/:scheduleId/seat-map',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(getSeatMapParamsSchema, 'params'),
    dashboardSeatSelectionController.getSeatMap
);

/**
 * @route   POST /api/v1/dashboard/seat-selection/schedules/:scheduleId/check-availability
 * @desc    Check if specific seats are available for a schedule
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * @body    { seatIds: string[] }
 * 
 * Quick availability check before booking
 * Returns availability status for each seat
 */
router.post(
    '/schedules/:scheduleId/check-availability',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(checkAvailabilityParamsSchema, 'params'),
    validate(checkAvailabilityBodySchema),
    dashboardSeatSelectionController.checkAvailability
);

/**
 * @route   POST /api/v1/dashboard/seat-selection/validate-seats
 * @desc    Validate seats for booking (existence, location match, availability)
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * @body    { scheduleId: string, seatIds: string[] }
 * 
 * Full validation before submitting booking
 * Ensures seats exist, belong to event location, and are available
 */
router.post(
    '/validate-seats',
    authMiddleware,
    permissionMiddleware(['bookings:read']),
    validate(validateSeatsBodySchema),
    dashboardSeatSelectionController.validateSeats
);

/**
 * @route   GET /api/v1/dashboard/seat-selection/events/:eventId/schedules/:scheduleId/reserved-seats
 * @desc    Get all reserved seats for a specific event and schedule
 * @access  Private (Dashboard - bookings:read permission)
 * 
 * Returns all reserved/booked seats with detailed information including:
 * - Seat details (label, number, row, section, zone)
 * - Booking details (number, status, admin booking flag)
 * - Customer/User information
 * 
 * Useful for viewing which seats are taken and by whom
 */
router.get(
    '/events/:eventId/schedules/:scheduleId/reserved-seats',
    validate(getReservedSeatsParamsSchema, 'params'),
    dashboardSeatSelectionController.getReservedSeats
);

export default router;
