import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      isPremium: boolean;
      roles?: string[];
      mfaVerified?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    username: string;
    isPremium: boolean;
    roles?: string[];
    mfaVerified?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    username: string;
    isPremium: boolean;
    roles?: string[];
    mfaVerified?: boolean;
  }
}