export const stackConfig = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID ?? "11111111-1111-4111-8111-111111111111",
  publishableClientKey:
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY ?? "stack_publishable_client_key_placeholder",
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY ?? "stack_secret_server_key_placeholder",
  afterSignIn: "/",
  afterSignUp: "/",
  afterSignOut: "/",
}

export const stackIsConfigured = Boolean(
  process.env.NEXT_PUBLIC_STACK_PROJECT_ID &&
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY &&
    process.env.STACK_SECRET_SERVER_KEY,
)
