/**
 * Stack Auth server-side app instance (lazy-initialized).
 *
 * Used by API routes to verify access tokens and API keys.
 * Requires NEXT_PUBLIC_STACK_PROJECT_ID, STACK_SECRET_SERVER_KEY,
 * and NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY env vars.
 *
 * Lazy initialization avoids crashing at import time when Stack Auth
 * env vars are not configured (e.g., local dev with agent API key bypass).
 *
 * @see https://docs.stack-auth.com/docs/concepts/backend-integration
 */
import "server-only";
import { StackServerApp } from "@stackframe/stack";

let _instance: StackServerApp | null = null;

export const stackServerApp = {
  getUser: async (...args: Parameters<StackServerApp["getUser"]>) => {
    if (!_instance) {
      _instance = new StackServerApp({ tokenStore: "nextjs-cookie" });
    }
    return _instance.getUser(...args);
  },
};
