import { User } from './user';

describe('User type', () => {
  it('should accept a valid user object', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
  });
});
