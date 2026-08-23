import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const redis = new Redis(process.env.REDIS_URL as string);

// KITA TAMBAHKAN refreshToken SEBAGAI PARAMETER
async function getDriveQuota(accessToken: string, refreshToken: string) {
  // MESIN OAUTH SEKARANG DIBEKALI CLIENT ID & SECRET BIAR BISA REFRESH OTOMATIS
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  // SUNTIKKAN KEDUA TOKEN
  oauth2Client.setCredentials({ 
    access_token: accessToken,
    refresh_token: refreshToken 
  });
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const res = await drive.about.get({ fields: 'storageQuota' });
  return res.data.storageQuota;
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminEmail = session.user.email;
    const fetchPromises = [];
    
    const redisData = await redis.get(`linked_accounts:${adminEmail}`);
    const linkedAccounts = redisData ? JSON.parse(redisData) : {};
    
    for (const [email, acc] of Object.entries<any>(linkedAccounts)) {
      if (acc.status === 'active' && acc.accessToken) {
        // OVERING REFRESH TOKEN KE MESIN
        fetchPromises.push(getDriveQuota(acc.accessToken, acc.refreshToken));
      }
    }
    
    if (fetchPromises.length === 0) {
      return NextResponse.json({ usage: '0', limit: '0' }, { status: 200 });
    }
    
    const results = await Promise.allSettled(fetchPromises);
    let totalUsage = 0;
    let totalLimit = 0;
    
    results.forEach((result: any) => {
      if (result.status === 'fulfilled' && result.value) {
        totalUsage += parseInt(result.value.usage || '0', 10);
        totalLimit += parseInt(result.value.limit || '0', 10);
      } else if (result.status === 'rejected') {
         console.error("Gagal menarik kuota:", result.reason);
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