import "server-only"
import { StackServerApp } from "@stackframe/stack"
import { stackConfig, stackIsConfigured } from "@/stack/config"

export { stackIsConfigured }

export const stackServerApp = new StackServerApp({
  projectId: stackConfig.projectId,
  publishableClientKey: stackConfig.publishableClientKey,
  secretServerKey: stackConfig.secretServerKey,
  tokenStore: "nextjs-cookie",
  urls: {
    afterSignIn: stackConfig.afterSignIn,
    afterSignUp: stackConfig.afterSignUp,
    afterSignOut: stackConfig.afterSignOut,
  },
})

export async function getCurrentStackUser() {
  if (!stackIsConfigured) {
    return null
  }

  try {
    return await stackServerApp.getUser({ includeRestricted: true })
  } catch {
    return null
  }
}
