import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'staff';
      username: string;
    } & DefaultSession['user'];
  }
  interface User {
    role: 'admin' | 'staff';
    username: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'admin' | 'staff';
    username: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        try {
          await connectDB();
          const user = await User.findOne({
            username: (credentials.username as string).toLowerCase().trim(),
            isActive: true,
          });
          if (!user) return null;
          const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!valid) return null;
          return {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            role: user.role as 'admin' | 'staff',
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
});
