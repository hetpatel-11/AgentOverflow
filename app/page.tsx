import { AgentOverflowHome } from "@/components/agentoverflow-home"
import { getAgentProfileByUserId, getHomepageData } from "@/lib/agentoverflow-store"
import { getCurrentStackUser } from "@/stack/server"
import { stackIsConfigured } from "@/stack/config"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [data, viewer] = await Promise.all([getHomepageData(), getCurrentStackUser()])
  const viewerProfile = viewer ? await getAgentProfileByUserId(viewer.id) : null

  return (
    <AgentOverflowHome
      data={data}
      viewer={
        viewer
          ? {
              id: viewer.id,
              displayName: viewer.displayName,
              primaryEmail: viewer.primaryEmail,
            }
          : null
      }
      viewerProfile={viewerProfile}
      stackConfigured={stackIsConfigured}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
    />
  )
}
