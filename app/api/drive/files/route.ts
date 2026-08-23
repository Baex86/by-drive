import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';
const redis = new Redis(process.env.REDIS_URL as string);

async function fetchFilesFromNode(accessToken: string, email: string, pageToken?: string, sortKey: string = "modifiedTime", sortDir: string = "desc", category: string = "Semua") {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    let driveOrderBy = `folder, ${sortKey} ${sortDir}`;
    
    // LOGIKA BERANDA-SENTRIS (ROOT) & KATEGORI GLOBAL
    let query = "trashed = false";
    if (category === 'Semua') {
      query += " and 'root' in parents"; // Murni nampilin beranda depan doang
    } else if (category === 'Video') {
      query += " and mimeType contains 'video/'";
    } else if (category === 'Music') {
      query += " and mimeType contains 'audio/'";
    } else if (category === 'Picture') {
      query += " and mimeType contains 'image/'";
    } else if (category === 'Document') {
      query += " and (mimeType contains 'pdf' or mimeType contains 'document' or mimeType contains 'text' or mimeType contains 'spreadsheet')";
    }
    
    const res = await drive.files.list({
      q: query,
      orderBy: driveOrderBy,
      pageSize: 50, 
      pageToken: pageToken || undefined,
      fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)",
    });
    
    const mappedFiles = (res.data.files || []).map(file => ({
      ...file,
      ownerEmail: email,
    }));

    return { files: mappedFiles, nextPageToken: res.data.nextPageToken, ownerEmail: email };
  } catch (error) {
    console.error(`Gagal tarik file dari node ${email}:`, error);
    return { files: [], nextPageToken: null, ownerEmail: email }; 
  }
}

export async function GET(req: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const adminEmail = session.user.email;
    const { searchParams } = new URL(req.url);
    
    const requestedDrive = searchParams.get('drive'); 
    const pageToken = searchParams.get('pageToken'); 
    const sortKey = searchParams.get('sortKey') || 'modifiedTime';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const category = searchParams.get('category') || 'Semua';

    const redisData = await redis.get(`linked_accounts:${adminEmail}`);
    const linkedAccounts = redisData ? JSON.parse(redisData) : {};
    let fetchPromises = [];

    if (requestedDrive && requestedDrive !== 'all') {
      const acc = linkedAccounts[requestedDrive];
      if (acc && acc.status === 'active' && acc.accessToken) {
        fetchPromises.push(fetchFilesFromNode(acc.accessToken, requestedDrive, pageToken || undefined, sortKey, sortDir, category));
      } else {
         return NextResponse.json({ error: 'Akun tidak valid atau tidak aktif' }, { status: 404 });
      }
    } else {
      for (const [email, acc] of Object.entries<any>(linkedAccounts)) {
        if (acc.status === 'active' && acc.accessToken) {
          fetchPromises.push(fetchFilesFromNode(acc.accessToken, email, undefined, sortKey, sortDir, category));
        }
      }
    }

    if (fetchPromises.length === 0) return NextResponse.json({ files: [], tokens: {} }, { status: 200 });

    const results = await Promise.allSettled(fetchPromises);
    let allFiles: any[] = [];
    let nextTokens: Record<string, string | null | undefined> = {};

    results.forEach((result: any) => {
      if (result.status === 'fulfilled' && result.value) {
        allFiles = [...allFiles, ...result.value.files];
        if (result.value.nextPageToken) nextTokens[result.value.ownerEmail] = result.value.nextPageToken;
      }
    });
    
    const FOLDER_MIME = 'application/vnd.google-apps.folder';

    allFiles.sort((a, b) => {
      const isFolderA = a.mimeType === FOLDER_MIME;
      const isFolderB = b.mimeType === FOLDER_MIME;

      if (isFolderA && !isFolderB) return -1;
      if (!isFolderA && isFolderB) return 1;

      let valA, valB;
      if (sortKey === 'name') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
      else if (sortKey === 'mimeType') { valA = a.mimeType; valB = b.mimeType; }
      else if (sortKey === 'quotaBytesUsed' || sortKey === 'size') { valA = parseInt(a.size || '0'); valB = parseInt(b.size || '0'); }
      else { valA = new Date(a.modifiedTime).getTime(); valB = new Date(b.modifiedTime).getTime(); }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    return NextResponse.json({ files: allFiles, tokens: nextTokens }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'System Error saat merangkum data' }, { status: 500 });
  }
}