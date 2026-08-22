import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

// Helper buat ngitung file biar kodenya nggak panjang
async function getFileCount(drive: any, query: string) {
  try {
    const res = await drive.files.list({
      q: `${query} and trashed = false`,
      fields: 'files(id)', // Cuma ambil ID biar super ringan
      pageSize: 1000, // Batas aman tanpa paginasi
    });
    return res.data.files ? res.data.files.length : 0;
  } catch (e) {
    console.error("Gagal kalkulasi query:", query);
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Tembak 4 kategori secara paralel (barengan)
    const [videoCount, compressedCount, imageCount, documentCount] = await Promise.all([
      getFileCount(drive, "mimeType contains 'video/'"),
      getFileCount(drive, "mimeType contains 'zip' or mimeType contains 'rar' or mimeType contains 'tar' or mimeType contains '7z'"),
      getFileCount(drive, "mimeType contains 'image/'"),
      getFileCount(drive, "mimeType contains 'application/pdf' or mimeType contains 'text/' or mimeType contains 'application/msword' or mimeType contains 'application/vnd.google-apps.document' or mimeType contains 'application/vnd.google-apps.spreadsheet'")
    ]);

    return NextResponse.json({
      video: videoCount,
      compressed: compressedCount,
      image: imageCount,
      document: documentCount
    }, { status: 200 });

  } catch (error: any) {
    console.error("Stats API Error:", error.message);
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}