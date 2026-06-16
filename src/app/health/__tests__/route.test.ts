import { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

// Import after mock
import { GET } from '@/app/health/route';

describe('GET /health', () => {
  it('returns 200 with status, uptime, and timestamp', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.timestamp).toBe('string');
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('does not expose sensitive fields', async () => {
    const res = await GET();
    const body = await res.json();
    expect(Object.keys(body)).toEqual(['status', 'uptime', 'timestamp']);
  });
});
