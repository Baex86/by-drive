import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const redis = new Redis(process.env.REDIS_URL as string);

// Helper function buat nembak 1 token
async function getDriveQuota(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const res = await drive.about.get({ fields: 'storageQuota' });
  return res.data.storageQuota;
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized: No Access Token' }, { status: 401 });
    }

    const adminEmail = session.user.email;
    const fetchPromises = [];

    // 1. Taruhan Janji: Akun Utama
    fetchPromises.push(getDriveQuota(session.accessToken));

    // 2. Taruhan Janji: Akun-akun Tambahan dari Redis
    const redisKey = `linked_accounts:${adminEmail}`;
    const redisData = await redis.get(redisKey);
    const linkedAccounts = redisData ? JSON.parse(redisData) : {};

    for (const [email, accountData] of Object.entries<any>(linkedAccounts)) {
      if (accountData.status === 'active' && accountData.accessToken) {
        fetchPromises.push(getDriveQuota(accountData.accessToken));
      }
    }

    // 3. Eksekusi semua secara paralel
    const results = await Promise.allSettled(fetchPromises);

    let totalUsage = 0;
    let totalLimit = 0;

    // 4. Gabungkan hasil (Aggregator)
    // 4. Gabungkan hasil (Aggregator) dengan aman
    results.forEach((result: any) => {
      if (result.status === 'fulfilled' && result.value) {
        totalUsage += parseInt(result.value.usage || '0', 10);
        totalLimit += parseInt(result.value.limit || '0', 10);
      } else if (result.status === 'rejected') {
        console.error("Gagal menarik kuota salah satu node:", result.reason);
      }
    });

    return NextResponse.json({
      usage: totalUsage.toString(),
      limit: totalLimit.toString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error("Quota API Error:", error.message);
    return NextResponse.json({ error: 'Gagal merangkum data agregat' }, { status: 500 });
  }
}