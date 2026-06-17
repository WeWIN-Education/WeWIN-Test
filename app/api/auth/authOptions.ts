import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { verifyCredentialUser } from "@/app/lib/users";
import { allowedEmails } from "@/app/constants/email";
import {
  getGoogleClientId,
  getGoogleClientSecret,
  isGoogleAuthConfigured,
} from "@/app/lib/googleAuth";

/** ---- TYPES FIX ---- */
interface GoogleAccount {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleProfile {
  email?: string;
  name?: string;
  picture?: string;
}

function resolveRole(email?: string | null): "admin" | "user" {
  if (!email) return "user";
  return allowedEmails.includes(email) ? "admin" : "user";
}

const DEV_AUTH_SECRET = "wewin-ielts-dev-secret-do-not-use-in-production";

function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? DEV_AUTH_SECRET;

  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "development") {
    console.warn(
      "[next-auth] NEXTAUTH_SECRET is missing. Using development fallback secret."
    );
  }

  return secret;
}

/** NEXTAUTH FULL GOOGLE DRIVE + SHEETS + GMAIL */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email và mật khẩu",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await verifyCredentialUser(
          credentials.email,
          credentials.password
        );

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    ...(isGoogleAuthConfigured()
      ? [
          GoogleProvider({
            clientId: getGoogleClientId()!,
            clientSecret: getGoogleClientSecret()!,
            authorization: {
              params: {
                scope: [
                  "openid",
                  "email",
                  "profile",
                  "https://www.googleapis.com/auth/drive.file",
                  "https://www.googleapis.com/auth/spreadsheets",
                  "https://www.googleapis.com/auth/gmail.send",
                ].join(" "),
                access_type: "offline",
                prompt: "consent",
              },
            },
          }),
        ]
      : []),
  ],

  callbacks: {
    /** JWT CALLBACK */
    async jwt({ token, account, profile, user }) {
      const acc = account as GoogleAccount | null;
      const pf = profile as GoogleProfile | null;

      // Credentials login (OAuth providers also pass `user`, but always have `account`)
      if (user && !acc) {
        token.userId = user.id;
        token.sub = user.id;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
        token.role = (user as { role?: "admin" | "user" }).role ?? "user";
        token.provider = "credentials";
        token.accessToken = undefined;
        token.refreshToken = undefined;
        token.expiresAt = undefined;
        return token;
      }

      // FIRST LOGIN (Google)
      if (acc) {
        token.accessToken = acc.access_token;
        token.refreshToken = acc.refresh_token ?? token.refreshToken;
        token.expiresAt = Date.now() + acc.expires_in * 1000;
        token.provider = "google";
      }

      // Sync user (Google)
      if (acc && pf) {
        token.email = pf.email ?? token.email;
        token.name = pf.name ?? token.name;
        token.picture = pf.picture ?? token.picture;
        token.userId = pf.email ?? token.userId;
        token.role = resolveRole(pf.email);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (apiUrl) {
          try {
            const res = await fetch(`${apiUrl}/auth/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: pf.email,
                name: pf.name,
                image: pf.picture,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              token.userId = data.id || pf.email;
            }
          } catch (err) {
            console.error("User sync error:", err);
          }
        }
      }

      // Credentials session — no Google token refresh
      if (token.provider === "credentials") return token;

      // ACCESS TOKEN STILL VALID
      if (token.expiresAt && Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // EXPIRED → REFRESH
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    /** SESSION CALLBACK */
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = (token.error as string) ?? undefined;

      if (session.user) {
        session.user.id = (token.userId as string) ?? undefined;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string) ?? session.user.image;
        session.user.role = (token.role as "admin" | "user") ?? "user";
      }

      return session;
    },
  },

  session: { strategy: "jwt" },
  secret: getAuthSecret(),
  pages: { signIn: "/login" },
};

/** ---- REFRESH TOKEN ---- */
async function refreshAccessToken(token: JWT) {
  try {
    if (!token.refreshToken) {
      console.error("No refresh token available.");
      return { ...token, error: "NoRefreshToken" };
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getGoogleClientId()!,
        client_secret: getGoogleClientSecret()!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (err) {
    console.error("Token refresh error:", err);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
