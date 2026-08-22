import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import Redis from 'ioredis';

// BARIS SAKTI INI: Memaksa Next.js untuk selalu narik data terbaru, dilarang nge-cache!
export const dynamic = 'force-dynamic';

// Inisialisasi koneksi Redis (Cukup sekali aja di sini)
const redis = new Redis(process.env.REDIS_URL as string);

// ==========================================
// FUNGSI GET: Mengambil daftar akun dari Redis
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmail = session.user.email;
    const redisKey = `linked_accounts:${adminEmail}`;
    const data = await redis.get(redisKey);

    const linkedAccounts = data ? JSON.parse(data) : {};
    
    // Saring data rahasia (token), cuma kirim info dasar ke UI
    const safeAccounts = Object.keys(linkedAccounts).map(email => ({
      email,
      status: linkedAccounts[email].status,
      addedAt: linkedAccounts[email].addedAt,
    }));

    return NextResponse.json({ accounts: safeAccounts }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// ==========================================
// FUNGSI DELETE: Menghapus akun dari Redis
// ==========================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const accountToRemove = body.email;
    
    if (!accountToRemove) {
      return NextResponse.json({ error: 'Email yang mau dihapus tidak valid' }, { status: 400 });
    }

    const adminEmail = session.user.email;
    const redisKey = `linked_accounts:${adminEmail}`;
    
    const data = await redis.get(redisKey);
    if (!data) {
      return NextResponse.json({ error: 'Brankas akun tidak ditemukan' }, { status: 404 });
    }

    const linkedAccounts = JSON.parse(data);
    
    // Cek apakah akun beneran ada di dalam brankas
    if (linkedAccounts[accountToRemove]) {
      // Hapus properti (akun) dari objek
      delete linkedAccounts[accountToRemove];
      
      // Simpan ulang objek yang udah bersih ke Redis
      await redis.set(redisKey, JSON.stringify(linkedAccounts));
      
      return NextResponse.json({ success: true, message: 'Akun berhasil dihapus' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Akun tidak terdaftar di sistem' }, { status: 404 });
    }
  } catch (error) {
    console.error("Gagal menghapus akun:", error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}