import { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authDB } from './database';
import { loginSchema } from './validation';

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'Enter your email'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const validatedFields = loginSchema.safeParse(credentials);
          
          if (!validatedFields.success) {
            return null;
          }

          const { email, password } = validatedFields.data;

          // Validate user credentials
          const user = await authDB.validateUser(email, password);
          
          if (!user) {
            return null;
          }

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            username: user.username,
            isPremium: user.isPremium,
            image: user.profileImage,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.username = user.username;
        token.isPremium = user.isPremium;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
        session.user.isPremium = token.isPremium as boolean;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPages = nextUrl.pathname.startsWith('/auth');
      const isOnProtectedPages = ['/playlist', '/library', '/liked-songs', '/settings'].some(
        path => nextUrl.pathname.startsWith(path)
      );

      // Redirect logged-in users away from auth pages
      if (isLoggedIn && isOnAuthPages) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Redirect unauthenticated users from protected pages
      if (!isLoggedIn && isOnProtectedPages) {
        return Response.redirect(new URL('/auth/login', nextUrl));
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};