import { describe, it, expect } from 'vitest';
import { assertTestDatabase } from './setup/db';

// Test setup adds sample people and the browser-test setup changes the owner's password: never on a real database.
describe('test setup runs only on a test database', () => {
  it('accepts a database whose name ends in _test', () => {
    expect(() => assertTestDatabase('postgres://postgres:postgres@localhost:5433/sns_test')).not.toThrow();
  });
  it.each(['postgres://u:p@localhost:5433/sns_dev', 'postgres://u:p@db.example/sns', 'not a url', undefined])('refuses %s', (url) => {
    expect(() => assertTestDatabase(url)).toThrow(/must end in _test/);
  });
});
