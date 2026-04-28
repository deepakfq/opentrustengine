import { NormalizedTrustEvent } from '../types';

const VALID_ROLES = ['buyer', 'seller', 'employer', 'worker', 'freelancer', 'organiser', 'influencer', 'investor'];

export class EventValidator {
  validate(event: NormalizedTrustEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.entityType) errors.push('missing entityType');
    if (!event.entityId) errors.push('missing entityId');
    if (!event.eventType) errors.push('missing eventType');
    if (!event.role) errors.push('missing role');
    if (!VALID_ROLES.includes(event.role)) errors.push(`invalid role: ${event.role}`);
    if (typeof event.rawValue !== 'number' || isNaN(event.rawValue)) errors.push('invalid rawValue');

    return { valid: errors.length === 0, errors };
  }
}
