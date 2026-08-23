import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const redis = new Redis(process.env.REDIS_URL as string);

async function getFileCount(accessToken: string, refreshToken: string, query: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ 
      access_token: accessToken,
      refresh_token: refreshToken 
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    const res = await drive.files.list({
      q: `${query} and trashed = false`,
      fields: 'files(id)', 
      pageSize: 1000, 
    });
    return res.data.files ? res.data.files.length : 0;
  } catch (e: any) {
    console.error("Gagal kalkulasi query:", e.message);
    return 0; 
  }
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminEmail = session.user.email;
    const redisData = await redis.get(`linked_accounts:${adminEmail}`);
    const linkedAccounts = redisData ? JSON.parse(redisData) : {};
    
    let totalVideo = 0;
    let totalCompressed = 0;
    let totalImage = 0;
    let totalDocument = 0;
    const fetchPromises: Promise<any>[] = [];
    
    for (const [email, acc] of Object.entries<any>(linkedAccounts)) {
      if (acc.status === 'active' && acc.accessToken) {
        const accountPromise = Promise.all([
          getFileCount(acc.accessToken, acc.refreshToken, "mimeType contains 'video/'"),
          getFileCount(acc.accessToken, acc.refreshToken, "mimeType contains 'zip' or mimeType contains 'rar' or mimeType contains 'tar' or mimeType contains '7z'"),
          getFileCount(acc.accessToken, acc.refreshToken, "mimeType contains 'image/'"),
          getFileCount(acc.accessToken, acc.refreshToken, "mimeType contains 'application/pdf' or mimeType contains 'text/' or mimeType contains 'application/msword' or mimeType contains 'application/vnd.google-apps.document' or mimeType contains 'application/vnd.google-apps.spreadsheet'")
        ]).then(([video, compressed, image, document]) => {
          totalVideo += video;
          totalCompressed += compressed;
          totalImage += image;
          totalDocument += document;
        });
        fetchPromises.push(accountPromise);
      }
    }
    
    await Promise.allSettled(fetchPromises);
    return NextResponse.json({ video: totalVideo, compressed: totalCompressed, image: totalImage, document: totalDocument }, { status: 200 });
  } catch (error: any) {
    console.error("Stats API Error:", error.message);
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}