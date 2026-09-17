import { runSync } from './sync.ts'

const result = await runSync()
console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
