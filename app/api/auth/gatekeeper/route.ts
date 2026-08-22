import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL as string);

export async function POST(req: NextRequest) {
  try {
    // ambil IP untuk rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rlKey = `rl:${ip}`;
    
    const attempts = await redis.incr(rlKey);
    if (attempts === 1) await redis.expire(rlKey, 900); // 15 menit
    if (attempts > 5) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 429 });
    }

    const body = await req.json();
    const { passcode } = body;
    if (!passcode) return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 400 });

    const adminPw = process.env.ADMIN_PASSWORD || '';
    let isAdmin = false;
    
    // validasi konstanta waktu (anti timing attack)
    if (passcode.length === adminPw.length && adminPw.length > 0) {
      isAdmin = crypto.timingSafeEqual(Buffer.from(passcode), Buffer.from(adminPw));
    }

    if (isAdmin) {
      await redis.del(rlKey);
      return NextResponse.json({ success: true, role: 'admin' }, { status: 200 });
    }

    // fallback ke validasi Guest
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