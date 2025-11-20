import { StackClientApp } from "@stackframe/stack";

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId: (process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "").trim(),
  publishableClientKey: (process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "").trim(),
});
