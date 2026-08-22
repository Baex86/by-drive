import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import Redis from 'ioredis';

// Inisialisasi koneksi Redis pake URL dari .env.local lu
const redis = new Redis(process.env.REDIS_URL as string);

export async function POST(req: NextRequest) {
  try {
    // 1. Proteksi: Pastiin cuma lu (Admin) yang udah login Google yang bisa generate kode ini
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Cuma Admin yang bisa generate akses Guest.' }, { status: 401 });
    }

    const body = await req.json();
    // Default durasi 24 jam kalau lu nggak nentuin waktunya
    const { durationHours = 24 } = body; 

    // 2. Generate 6 karakter unik (kombinasi huruf besar dan angka)
    const guestCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Simpan ke Redis dengan fungsi TTL (EX = expiration dalam hitungan detik)
    const expirationInSeconds = durationHours * 3600;
    await redis.set(`guest_access:${guestCode}`, 'valid', 'EX', expirationInSeconds);

    return NextResponse.json({
      success: true,
      message: `Passcode Guest berhasil dibuat dan akan kedaluwarsa dalam ${durationHours} jam.`,
      passcode: guestCode,
      expiresInHours: durationHours
    }, { status: 200 });

  } catch (error: any) {
    console.error('Redis Generate Error:', error);
    return NextResponse.json({ 
      error: 'Gagal membuat passcode Guest.',
      details: error.message 
    }, { status: 500 });
  }
}