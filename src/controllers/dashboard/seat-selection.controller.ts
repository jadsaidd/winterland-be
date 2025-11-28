import { NextFunction, Request, Response } from 'express';

import {
    CheckAvailabilityBody,
    CheckAvailabilityParams,
    GetRowsParams,
    GetSeatMapParams,
    GetSeatsParams,
    GetSectionsParams,
    GetZonesParams,
    ValidateSeatsBody,
} from '../../schemas/seat-selection.schema';
import seatSelectionService from '../../services/seat-selection.service';

/**
 * Dashboard Seat Selection Controller
 * Handles HTTP requests for seat selection endpoints
 * Provides hierarchical navigation: Zones → Sections → Rows → Seats
 */
export class DashboardSeatSelectionController {
    /**
     * Get zones for a schedule with availability
     * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/zones
     * 
     * First level of seat selection - shows all zones with seat counts
     */
    getZones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId } = req.params as unknown as GetZonesParams;

            const result = await seatSelectionService.getZonesForSchedule(scheduleId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get sections for a specific zone with availability
     * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/zones/:locationZoneId/sections
     * 
     * Second level - shows sections within a zone with row counts
     */
    getSections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId, locationZoneId } = req.params as unknown as GetSectionsParams;

            const result = await seatSelectionService.getSectionsForZone(
                scheduleId,
                locationZoneId
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get rows for a specific section with seat availability
     * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/sections/:sectionId/rows
     * 
     * Third level - shows rows with individual seat availability
     */
    getRows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId, sectionId } = req.params as unknown as GetRowsParams;

            const result = await seatSelectionService.getRowsForSection(
                scheduleId,
                sectionId
            );

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get seats for a specific row with availability
     * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/rows/:rowId/seats
     * 
     * Fourth (final) level - shows individual seats with availability
     */
    getSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId, rowId } = req.params as unknown as GetSeatsParams;

            const result = await seatSelectionService.getSeatsForRow(scheduleId, rowId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get full seat map for a schedule
     * GET /api/v1/dashboard/seat-selection/schedules/:scheduleId/seat-map
     * 
     * Returns complete hierarchy in one call - useful for rendering full seat map UI
     */
    getSeatMap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId } = req.params as unknown as GetSeatMapParams;

            const result = await seatSelectionService.getFullSeatMap(scheduleId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Check availability of specific seats
     * POST /api/v1/dashboard/seat-selection/schedules/:scheduleId/check-availability
     * 
     * Quick check if specific seats are still available before booking
     */
    checkAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId } = req.params as unknown as CheckAvailabilityParams;
            const { seatIds } = req.body as CheckAvailabilityBody;

            const result = await seatSelectionService.checkSeatsAvailability(scheduleId, seatIds);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Validate seats for booking
     * POST /api/v1/dashboard/seat-selection/validate-seats
     * 
     * Full validation before submitting booking - checks existence, location match, and availability
     */
    validateSeats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { scheduleId, seatIds } = req.body as ValidateSeatsBody;

            const result = await seatSelectionService.validateSeatsForBooking(scheduleId, seatIds);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}

export const dashboardSeatSelectionController = new DashboardSeatSelectionController();
export default dashboardSeatSelectionController;
