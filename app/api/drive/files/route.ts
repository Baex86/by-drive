import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL as string);

// Fungsi pembantu buat nembak Drive API pakai Access Token
async function fetchDriveFiles(email: string, accessToken: string, accountType: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const res = await drive.files.list({
      pageSize: 50, // Batas aman Vercel Timeout (ambil 50 terbaru)
      fields: 'files(id, name, mimeType, size, webViewLink, iconLink)',
      orderBy: 'modifiedTime desc', // Urutkan dari yang paling baru diubah
    });

    const files = res.data.files || [];
    // Tambahkan "cap" atau identitas akun ke setiap file
    return files.map(file => ({
      ...file,
      sourceAccount: email,
      accountType: accountType
    }));
  } catch (error: any) {
    console.error(`Gagal narik data dari akun ${email}:`, error.message);
    throw new Error(`Gagal narik data dari akun ${email}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Dapatkan Token Akun Utama (Admin)
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email || !session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminEmail = session.user.email;
    const adminToken = session.accessToken;

    // 2. Dapatkan Token Akun Tambahan dari Redis
    const redisKey = `linked_accounts:${adminEmail}`;
    const redisData = await redis.get(redisKey);
    const linkedAccounts = redisData ? JSON.parse(redisData) : {};

    // 3. Kumpulkan semua janji (Promises) penarikan data
    const fetchPromises = [];

    // Janji 1: Tarik dari Akun Utama
    fetchPromises.push(fetchDriveFiles(adminEmail, adminToken, 'Utama'));

    // Janji 2..dst: Tarik dari Akun Tambahan
    for (const [email, accountData] of Object.entries<any>(linkedAccounts)) {
      if (accountData.status === 'active' && accountData.accessToken) {
        fetchPromises.push(fetchDriveFiles(email, accountData.accessToken, 'Tambahan'));
      }
    }

    // 4. Eksekusi semua janji secara Paralel & Tunggu Semuanya Selesai
    const results = await Promise.allSettled(fetchPromises);

    // 5. Gabungkan hasil yang sukses jadi satu array
    let allFiles: any[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allFiles = [...allFiles, ...result.value];
      }
    });

    // Opsional: Urutkan ulang seluruh file gabungan berdasarkan nama (atau tanggal)
    allFiles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return NextResponse.json({ 
      success: true, 
      totalFiles: allFiles.length,
      files: allFiles 
    }, { status: 200 });

  } catch (error) {
    console.error("Aggregator Error:", error);
    return NextResponse.json({ error: 'Terjadi kegagalan pada mesin Aggregator' }, { status: 500 });
  }
}