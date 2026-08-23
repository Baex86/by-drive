import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const redis = new Redis(process.env.REDIS_URL as string);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = session.user.email;
    const redisKey = `linked_accounts:${adminEmail}`;

    await redis.del(redisKey);

    return NextResponse.json({ message: 'Semua akun berhasil direset dari sistem' }, { status: 200 });
  } catch (error) {
    console.error("Nuke API Error:", error);
    return NextResponse.json({ error: 'Gagal melakukan hard reset' }, { status: 500 });
  }
}