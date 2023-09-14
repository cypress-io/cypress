import fs from 'fs-extra'
import path from 'path'
import crossFetch from 'cross-fetch'

const INTERNAL_CLOUD_ENV = process.env.CYPRESS_INTERNAL_ENV || 'production'

const CY_CLOUD_VALIDATION_BASE = {
  test: 'https://api.cypress.io',
  production: 'https://api.cypress.io',
  staging: 'https://api-staging.cypress.io',
  development: 'http://localhost:1234',
}

const VALIDATION_BASE = CY_CLOUD_VALIDATION_BASE[INTERNAL_CLOUD_ENV]

const OUTPUT_FOLDER = path.join(__dirname, '../../../system-tests/lib/validations')

export async function syncCloudValidations () {
  const [validationsResponse, typesResponse] = await Promise.all([
    crossFetch(`${VALIDATION_BASE}/cypress-app/validations`),
    crossFetch(`${VALIDATION_BASE}/cypress-app/validations/types`),
  ])
  const [validations, validationsTypes] = await Promise.all([
    validationsResponse.text(),
    typesResponse.text(),
  ])

  await fs.ensureDir(OUTPUT_FOLDER)

  await Promise.all([
    fs.promises.writeFile(path.join(OUTPUT_FOLDER, 'cloudValidations.js'), validations),
    fs.promises.writeFile(path.join(OUTPUT_FOLDER, 'cloudValidations.d.ts'), validationsTypes),
  ])
}

export async function ensureCloudValidations () {
  if (!fs.existsSync(path.join(OUTPUT_FOLDER, 'cloudValidations.js')) || !fs.existsSync(path.join(OUTPUT_FOLDER, 'cloudValidations.d.ts'))) {
    await syncCloudValidations()
  }
}
