import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL as string);

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rlKey = `rl:${ip}`;
    
    const attempts = await redis.incr(rlKey);
    if (attempts === 1) await redis.expire(rlKey, 900); // 15 menit
    if (attempts > 5) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan' }, { status: 429 });
    }

    const body = await req.json();
    const { passcode } = body;
    if (!passcode) return NextResponse.json({ error: 'Passcode wajib diisi' }, { status: 400 });

    // API INI SEKARANG MURNI HANYA UNTUK VALIDASI GUEST
    const upperPasscode = passcode.toUpperCase();
    const isValidGuest = await redis.get(`guest_access:${upperPasscode}`);

    if (isValidGuest) {
      await redis.del(rlKey);
      const cookieStore = await cookies();
      cookieStore.set('guest_session', upperPasscode, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return NextResponse.json({ success: true, role: 'guest' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });

  } catch (error) {
    return NextResponse.json({ error: 'Sistem mengalami gangguan' }, { status: 500 });
  }
}