import fs from '../../../util/fs'
import { InitConfig } from '../types'
import { defaultValues } from './option_info'
import { join, basename, extname } from 'path'
import {
  getFolderName as exampleFolderName,
  getPathToExamples as getExampleSpecPaths,
} from '@packages/example'

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

  if (config.example) {
    const exampleFolder = join(folderPath, exampleFolderName())

    await fs.ensureDir(exampleFolder)

    const filePaths = await getExampleSpecPaths()

    filePaths.forEach((path) => {
      const ext = extname(path)
      const filename = config.typescript
        ? basename(path).replace(ext, '.ts')
        : basename(path)

      fs.copy(path, join(exampleFolder, filename))
    })
  }
}
