import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const redis = new Redis(process.env.REDIS_URL as string);

export async function POST(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const adminEmail = session.user.email;
    const body = await req.json();
    const { action, fileId, accountEmail, newName, destinationFolderId } = body;

    // Filter awal: pastikan peluru yang dikirim UI lengkap
    if (!action || !fileId || !accountEmail) {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 });
    }

    // 1. Ambil brankas Redis dan cari kunci akun yang spesifik punya file ini
    const redisData = await redis.get(`linked_accounts:${adminEmail}`);
    const linkedAccounts = redisData ? JSON.parse(redisData) : {};
    const acc = linkedAccounts[accountEmail];

    if (!acc || !acc.accessToken) {
      return NextResponse.json({ error: 'Akun tidak ditemukan atau tidak aktif' }, { status: 404 });
    }

    // 2. Setup Google Client dengan Auto-Refresh Token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ 
      access_token: acc.accessToken,
      refresh_token: acc.refreshToken 
    });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 3. SWITCHBOARD: Eksekusi berdasarkan komando
    if (action === 'delete') {
      // Soft Delete: Lempar ke tempat sampah, jangan dibakar permanen
      await drive.files.update({ fileId, requestBody: { trashed: true } });
      return NextResponse.json({ success: true, message: 'File dipindahkan ke tempat sampah' }, { status: 200 });
    } 
    
    else if (action === 'rename') {
      if (!newName) return NextResponse.json({ error: 'Nama baru wajib diisi' }, { status: 400 });
      const res = await drive.files.update({ 
        fileId, 
        requestBody: { name: newName }, 
        fields: 'id, name, modifiedTime' 
      });
      return NextResponse.json({ success: true, message: 'File berhasil diganti nama', file: res.data }, { status: 200 });
    }

    else if (action === 'move') {
      if (!destinationFolderId) return NextResponse.json({ error: 'Folder tujuan wajib diisi' }, { status: 400 });
      
      // Tahap 1: Tanya Google dulu, file ini sekarang ada di folder mana (Parent Lama)?
      const file = await drive.files.get({ fileId, fields: 'parents' });
      const previousParents = file.data.parents?.join(',') || '';
      
      // Tahap 2: Cabut dari parent lama, tempel ke parent baru
      await drive.files.update({
        fileId,
        addParents: destinationFolderId,
        removeParents: previousParents,
        fields: 'id, parents'
      });
      return NextResponse.json({ success: true, message: 'File berhasil dipindahkan' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal oleh sistem' }, { status: 400 });

  } catch (error: any) {
    console.error("Drive Action Error:", error.message);
    return NextResponse.json({ error: 'Gagal mengeksekusi aksi di Google Drive' }, { status: 500 });
  }
}