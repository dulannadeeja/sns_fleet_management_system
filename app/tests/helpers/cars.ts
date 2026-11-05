import { randomUUID } from 'node:crypto';

/** A unique sample registration number (not a real plate); the car tables are never cleaned up. */
export const samplePlate = () => `SMP ${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
