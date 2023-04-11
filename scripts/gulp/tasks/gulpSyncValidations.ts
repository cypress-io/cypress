import fs from 'fs-extra'
import path from 'path'
import crossFetch from 'cross-fetch'

const VALIDATION_BASE = process.env.CY_CLOUD_VALIDATION_BASE ?? 'http://localhost:1234'

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
