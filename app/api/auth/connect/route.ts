import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  // 1. Pastikan yang nge-klik cuma Admin yang sah
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Siapkan mesin OAuth Custom
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/custom` 
  );

  // 3. Generate URL ke halaman persetujuan Google
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    // KUNCI JAWABANNYA DI SINI: Tambahin scope email biar callback nggak diblokir
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    state: session.user.email 
  });

  // 4. Lemparkan user ke halaman Google
  return NextResponse.redirect(authUrl);
}