import fs from '../../../../util/fs'
import { InitConfig } from '../../types'
import { generateFolders } from './generate_folders'
import { installPackages } from './install'

export const create = async (projRoot: string, config: InitConfig) => {
  await fs.writeFile(`${projRoot}/cypress.json`, JSON.stringify(config.config, null, 2))

  await generateFolders(projRoot, config)
  await installPackages(projRoot, config)
}
