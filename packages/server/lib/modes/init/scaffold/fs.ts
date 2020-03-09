import fs from '../../../util/fs'

export const create = async (projRoot, { config }) => {
  await fs.writeFile(`${projRoot}/cypress.json`, JSON.stringify(config || {}, null, 2))
}
