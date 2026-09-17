import { serve } from '@hono/node-server'
import { app } from './app.ts'
import { HOST, PORT } from './config.ts'
import { hasHeroData, runSync } from './sync.ts'

async function main() {
  if (!hasHeroData()) {
    console.log('[boot] database is empty, running first sync')
    const result = await runSync()
    if (!result.ok) {
      console.error('[boot] initial sync failed:', result.error)
    }
  }

  serve(
    {
      fetch: app.fetch,
      hostname: HOST,
      port: PORT,
    },
    (info) => {
      console.log(`[api] listening on http://${info.address}:${info.port}`)
    }
  )
}

main().catch((error) => {
  console.error('[boot] fatal:', error)
  process.exit(1)
})
