// Cross-platform script to sync cloud validations for the server package.
// This ensures we have up-to-date TypeScript definitions for API operations.

import fs from 'fs'
import path from 'path'

const log = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(message)
}

const INTERNAL_CLOUD_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'

const CY_CLOUD_VALIDATION_BASE: Record<string, string> = {
  test: 'https://api.cypress.io',
  production: 'https://api.cypress.io',
  staging: 'https://api-staging.cypress.io',
  development: 'http://localhost:1234',
}

const VALIDATION_BASE = CY_CLOUD_VALIDATION_BASE[INTERNAL_CLOUD_ENV] || 'https://api.cypress.io'

const TYPES_URL = `${VALIDATION_BASE}/cypress-app/validations/types`

// Output to packages/server/lib/validations
const OUTPUT_FOLDER = path.join(__dirname, '..', 'lib', 'validations')
const DTS_FILE = path.join(OUTPUT_FOLDER, 'cloudValidations.d.ts')

async function syncCloudValidations () {
  log(`Syncing cloud validations from ${VALIDATION_BASE}...`)

  // Create output directory if it doesn't exist
  await fs.promises.mkdir(OUTPUT_FOLDER, { recursive: true })

  // Download types only (safer than downloading executable .js schemas)
  log('Downloading types...')

  const response = await fetch(TYPES_URL)

  if (!response.ok) {
    throw new Error(`Failed to download types: ${response.status} ${response.statusText}`)
  }

  const types = await response.text()
  const etag = response.headers.get('etag') || ''
  const lastSynced = new Date().toISOString()

  // TODO: Download .js validations when cloud package publishes an npm SDK
  // For now, we only download TypeScript definitions for type safety.

  // Prepend the ETag and sync timestamp as comments so `ensure` can detect
  // when the upstream types have changed without re-downloading the body.
  const contents = `// ETag: ${etag}\n// Last-Synced: ${lastSynced}\n\n${types}`

  await fs.promises.writeFile(DTS_FILE, contents)

  log('✅ Cloud validations synced successfully')
}

async function fetchCurrentEtag (): Promise<string | null> {
  // Get the current ETag without downloading the full content. If we can't
  // reach the API (e.g. offline), resolve to null and use the existing file.
  try {
    const response = await fetch(TYPES_URL, { method: 'HEAD' })

    if (!response.ok) {
      return null
    }

    return response.headers.get('etag') || null
  } catch (err) {
    return null
  }
}

async function readStoredEtag (): Promise<string> {
  const contents = await fs.promises.readFile(DTS_FILE, 'utf8')
  const firstLine = contents.split('\n', 1)[0]

  return firstLine.replace('// ETag: ', '').trim()
}

async function ensureCloudValidations () {
  if (!fs.existsSync(DTS_FILE)) {
    log('Cloud validation types file missing, syncing...')

    try {
      await syncCloudValidations()
    } catch (err) {
      log('❌ Failed to sync cloud validations. Build may fail without these files.')
      log(String(err))
      process.exit(1)
    }

    return
  }

  log('Checking if cloud validations are up to date...')

  const storedEtag = await readStoredEtag()
  const currentEtag = await fetchCurrentEtag()

  // If we couldn't fetch the ETag (offline), use the existing file.
  if (!currentEtag) {
    log('⚠️  Could not check ETag (offline?), using existing file')

    return
  }

  if (storedEtag !== currentEtag) {
    log('Cloud validation types are outdated (ETag changed), syncing...')

    try {
      await syncCloudValidations()
    } catch (err) {
      log('⚠️  Failed to sync, but existing file will be used')
      log(String(err))
    }

    return
  }

  log('✅ Cloud validation types are up to date (ETag matches)')
}

async function main () {
  const command = process.argv[2]

  if (command === 'sync') {
    await syncCloudValidations()
  } else {
    await ensureCloudValidations()
  }
}

main().catch((err) => {
  log('❌ Unexpected error syncing cloud validations')
  log(String(err))
  process.exit(1)
})
