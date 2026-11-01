import { randomUUID } from 'node:crypto';

/** A unique sample registration number (not a real plate); the car tables are never cleaned up. */
export const samplePlate = () => `SMP ${randomUUID().slice(0, 4).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`;
