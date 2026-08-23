import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'System Admin',
      credentials: {
        // KITA KEMBALIKAN KE 'password' KARENA NEXTAUTH KADANG NGE-BUG DI CUSTOM KEY
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Jaring pengaman: Kalau env lu nge-bug, dia bakal tetep baca PIN asli lu
        const adminPw = process.env.ADMIN_PASSWORD || '123baebayu';
        const inputPw = credentials?.password || '';

        if (inputPw === adminPw) {
          return {
            id: 'admin-1',
            name: 'Administrator',
            email: 'admin@bydrive.local',
            role: 'admin'
          };
        }
        return null; // Kalau salah, tolak
      }
    })
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role; }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) { (session.user as any).role = token.role; }
      return session;
    }
  },
  pages: { signIn: '/' }, 
  // Jaring pengaman secret
  secret: process.env.NEXTAUTH_SECRET || '123bytheking', 
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };