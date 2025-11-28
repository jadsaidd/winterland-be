import { BadRequestException } from '../exceptions/http.exception';
import { SessionRepository } from '../repositories/session.repository';

export class SessionService {
    private sessionRepository = new SessionRepository();

    async createSession(userId: string, eventId: string, scheduleId: string) {
        // Validate that the event exists and the schedule belongs to it
        const event = await this.sessionRepository.findEventWithSchedules(eventId);
        if (!event) {
            throw new BadRequestException('Event not found');
        }

        const scheduleExists = event.schedules.some((schedule: { id: string }) => schedule.id === scheduleId);
        if (!scheduleExists) {
            throw new BadRequestException('Schedule not found for this event');
        }

        // Generate a unique code
        const code = await this.sessionRepository.generateUniqueCode();

        // Create the session
        const session = await this.sessionRepository.create({
            userId,
            eventId,
            scheduleId,
            code,
        });

        // TODO: return the session URL
        return session;
    }
}

