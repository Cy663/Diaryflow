import { healthRouter } from './health';

describe('Health Route', () => {
  it('should export a router', () => {
    expect(healthRouter).toBeDefined();
  });
});
