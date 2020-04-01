import fs from '../../../util/fs'
import { InitConfig } from '../types'
import { defaultValues } from './option_info'
import { join, basename, extname, isAbsolute, dirname } from 'path'
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
  await fixturesFolder(projRoot, config)
  await supportFile(projRoot, config)
}

const integrationFolder = async (projRoot: string, config: InitConfig) => {
  const folderPath = config.config.integrationFolder ?? `${projRoot}/${defaultValues['integrationFolder']}`

  await fs.ensureDir(folderPath)

  if (config.example) {
    const exampleFolder = join(folderPath, exampleFolderName())

    await fs.ensureDir(exampleFolder)

    const filePaths = await getExampleSpecPaths()

    filePaths.forEach(async (path) => {
      const ext = extname(path)
      const filename = config.typescript
        ? basename(path).replace(ext, '.ts')
        : basename(path)

      await fs.copy(path, join(exampleFolder, filename))
    })
  }
}

const fixturesFolder = async (projRoot: string, { example, config: { fixturesFolder } }: InitConfig) => {
  if (fixturesFolder === false) {
    return
  }

  const defaultPath = `${projRoot}/${defaultValues['fixturesFolder']}`

  if (fixturesFolder) {
    const fixturesFolderPath = isAbsolute(fixturesFolder)
      ? fixturesFolder
      : `${projRoot}/${fixturesFolder}`

    if (fixturesFolderPath !== defaultPath) {
      return
    }
  }

  await fs.ensureDir(defaultPath)

  if (example) {
    await fs.copy(
      join(__dirname, '../../../', 'scaffold/fixtures/example.json'),
      join(defaultPath, 'example.json'),
    )
  }
}

const supportFile = async (projRoot: string, { typescript, config: { supportFile } }: InitConfig) => {
  if (supportFile === false) {
    return
  }

  const defaultPath = `${projRoot}/${defaultValues['supportFile']}`

  if (supportFile) {
    const supportFilePath = isAbsolute(supportFile)
      ? supportFile
      : `${projRoot}/${supportFile}`

    if (supportFilePath !== defaultPath) {
      return
    }
  }

  const defaultRoot = dirname(defaultPath)
  const scaffoldRoot = join(__dirname, '../../..', 'scaffold/support')

  await fs.ensureDir(defaultRoot)

  const filename = (root, name) => {
    return typescript
      ? join(root, name).replace('.js', '.ts')
      : join(root, name)
  }

  await fs.copy(
    join(scaffoldRoot, 'index.js'),
    filename(defaultRoot, 'index.js'),
  )

  await fs.copy(
    join(scaffoldRoot, 'commands.js'),
    filename(defaultRoot, 'commands.js'),
  )
}
