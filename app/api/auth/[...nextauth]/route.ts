import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Kita export authOptions biar bisa dipanggil di Server Component (Dashboard)
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 10 * 365 * 24 * 60 * 60, // 10 tahun (Selamanya)
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Supaya token bisa dibaca di Dashboard
      session.accessToken = token.accessToken as string; 
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };