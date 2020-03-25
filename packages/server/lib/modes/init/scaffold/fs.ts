import fs from '../../../util/fs'
import { InitConfig } from '../types'
import { defaultValues } from './option_info'

export const create = async (projRoot: string, config: InitConfig) => {
  await fs.writeFile(`${projRoot}/cypress.json`, JSON.stringify(config.config, null, 2))

  await generateFolders(projRoot, config)
}

const generateFolders = async (projRoot: string, config: InitConfig) => {
  await integrationFolder(projRoot, config)
}

const integrationFolder = async (projRoot: string, config: InitConfig) => {
  const folderPath = config.config.integrationFolder ?? `${projRoot}/${defaultValues['integrationFolder']}`

  await fs.ensureDir(folderPath)
}
