import { IS_DEMO, DEMO_USER } from "./demo-data";

function setupAuth() {
  if (IS_DEMO) {
    return {
      handlers: {
        GET: async () => Response.json({ demo: true }),
        POST: async () => Response.json({ demo: true }),
      },
      signIn: async () => undefined,
      signOut: async () => undefined,
      auth: async () => ({
        user: {
          id: DEMO_USER.id,
          name: DEMO_USER.displayName,
          email: DEMO_USER.email,
          image: null,
        },
        expires: new Date(Date.now() + 86400_000).toISOString(),
      }),
    };
  }

  // --- 本番 / 開発モード ---
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NextAuthFn = require("next-auth").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Google = require("next-auth/providers/google").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Credentials = require("next-auth/providers/credentials").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaAdapter } = require("@auth/prisma-adapter");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { prisma } = require("./db");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { z } = require("zod");

  const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  return NextAuthFn({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: { signIn: "/auth/signin" },
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "メール", type: "email" },
          password: { label: "パスワード", type: "password" },
        },
        async authorize(credentials: unknown) {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          });
          if (!user || !user.passwordHash) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.avatarUrl,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }: { token: any; user?: any }) {
        if (user) token.userId = user.id;
        return token;
      },
      async session({ session, token }: { session: any; token: any }) {
        if (token.userId) session.user.id = token.userId;
        return session;
      },
    },
  });
}

const result: any = setupAuth();
export const handlers = result.handlers;
export const signIn = result.signIn;
export const signOut = result.signOut;
export const auth = result.auth;
