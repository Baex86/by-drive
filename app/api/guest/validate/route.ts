import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode wajib diisi' }, { status: 400 });
    }

    const upperPasscode = passcode.toUpperCase();
    
    // Cek keberadaan passcode di Redis
    const isValid = await redis.get(`guest_access:${upperPasscode}`);

    if (!isValid) {
      return NextResponse.json({ error: 'Passcode tidak valid atau sudah kedaluwarsa' }, { status: 401 });
    }

    // Set cookie session buat Guest
    const cookieStore = await cookies();
    cookieStore.set('guest_session', upperPasscode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // Umur tiket default 24 jam di browser
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Akses Guest diizinkan'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Validate Error:', error);
    return NextResponse.json({ 
      error: 'Gagal memvalidasi passcode.',
      details: error.message 
    }, { status: 500 });
  }
}