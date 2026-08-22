import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    // Tarik token session dari cookies
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: 'Unauthorized. Sesi login lu mungkin udah kedaluwarsa, silakan login ulang.' }, { status: 401 });
    }

    const body = await req.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: 'Parameter fileId wajib dikirim' }, { status: 400 });
    }

    // Siapin client Google pake access token lu
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token.accessToken as string });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Hitung waktu 24 jam (H+1) dari sekarang
    const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Tembak API Google Drive buat ngasih akses 'anyone' dengan expirationTime
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
        expirationTime: expirationDate.toISOString(),
      },
    });

    // Ambil metadata link buat dioper ke frontend
    const fileData = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Akses 24 jam berhasil dibuka',
      data: fileData.data 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Drive API Error:', error);
    return NextResponse.json({ 
      error: 'Gagal memproses ke Google Drive. Cek console untuk detail.',
      details: error.message 
    }, { status: 500 });
  }
}