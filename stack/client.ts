import { StackClientApp } from "@stackframe/stack"
import { stackConfig, stackIsConfigured } from "@/stack/config"

export { stackIsConfigured }

export const stackClientApp = new StackClientApp({
  projectId: stackConfig.projectId,
  publishableClientKey: stackConfig.publishableClientKey,
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: stackConfig.afterSignIn,
    afterSignUp: stackConfig.afterSignUp,
    afterSignOut: stackConfig.afterSignOut,
  },
})
