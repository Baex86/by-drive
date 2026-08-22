import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL as string);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const adminEmail = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=Google_Auth_Failed', req.url));
    }

    if (!code || !adminEmail) {
      return NextResponse.redirect(new URL('/dashboard/settings?error=Invalid_Callback', req.url));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/custom`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error("Gagal mendapatkan Access Token dari Google");
    }

    // KUNCI JAWABANNYA DI SINI: Set kredensial secara global ke klien
    oauth2Client.setCredentials(tokens);

    // Panggil userinfo TANPA nyuntik oauth_token lagi, biarkan dia baca dari klien
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const newAccountEmail = userInfo.data.email;

    if (!newAccountEmail) {
       return NextResponse.redirect(new URL('/dashboard/settings?error=No_Email_Found', req.url));
    }

    const redisKey = `linked_accounts:${adminEmail}`;
    const existingAccountsStr = await redis.get(redisKey);
    let linkedAccounts = existingAccountsStr ? JSON.parse(existingAccountsStr) : {};

    linkedAccounts[newAccountEmail] = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || linkedAccounts[newAccountEmail]?.refreshToken,
      expiryDate: tokens.expiry_date,
      addedAt: new Date().toISOString(),
      status: 'active'
    };

    await redis.set(redisKey, JSON.stringify(linkedAccounts));

    return NextResponse.redirect(new URL('/dashboard/settings?success=Account_Linked', req.url));

  } catch (error: any) {
    console.error("Custom OAuth Error:", error);
    const errorMessage = error.message ? encodeURIComponent(error.message) : 'Unknown_Error';
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${errorMessage}`, req.url));
  }
}