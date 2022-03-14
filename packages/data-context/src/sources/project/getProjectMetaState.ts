import fs from 'fs-extra'
import path from 'path'

export interface ProjectMetaState {
  packageManagerUsed: 'pnpm' | 'npm' | 'yarn'
  configFilePath: string | false
  hasFrontendFramework: 'nuxt' | 'react' | 'react-scripts' | 'vue' | 'next' | false
  hasTypescript: boolean
  hasLegacyCypressJson: boolean
  hasCypressEnvFile: boolean
  hasValidConfigFile: boolean
  hasSpecifiedConfigViaCLI: false | string
  hasMultipleConfigPaths: boolean
  needsCypressJsonMigration: boolean
}

const PROJECT_META_STATE: ProjectMetaState = {
  configFilePath: false,
  hasFrontendFramework: false,
  hasTypescript: false,
  hasLegacyCypressJson: false,
  hasMultipleConfigPaths: false,
  hasCypressEnvFile: false,
  hasSpecifiedConfigViaCLI: false,
  hasValidConfigFile: false,
  needsCypressJsonMigration: false,
  packageManagerUsed: 'npm',
}

export function getProjectMetaState (projectRoot: string, configFile?: string | false | null): ProjectMetaState {
  const metaState: ProjectMetaState = {
    ...PROJECT_META_STATE,
    hasLegacyCypressJson: fs.existsSync(path.resolve(projectRoot, 'cypress.json')),
    hasCypressEnvFile: fs.existsSync(path.resolve(projectRoot, 'cypress.env.json')),
    packageManagerUsed: getPackageManagerUsed(projectRoot),
  }

  try {
    // Find the suggested framework, starting with meta-frameworks first
    const packageJson = fs.readJsonSync(path.resolve(projectRoot, 'package.json'))

    if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript || fs.existsSync(path.resolve(projectRoot, 'tsconfig.json'))) {
      metaState.hasTypescript = true
    }

    for (const framework of ['next', 'nuxt', 'react-scripts', 'react', 'vue'] as const) {
      if (packageJson.dependencies?.[framework] || packageJson.devDependencies?.[framework]) {
        metaState.hasFrontendFramework = framework
        break
      }
    }
  } catch {
    // No need to handle
  }

  if (configFile === false) {
    return metaState
  }

  if (typeof configFile === 'string') {
    metaState.hasSpecifiedConfigViaCLI = path.resolve(projectRoot, configFile)
    if (configFile.endsWith('.json')) {
      metaState.needsCypressJsonMigration = true
    } else {
      metaState.configFilePath = path.resolve(projectRoot, configFile)
      if (fs.existsSync(metaState.configFilePath)) {
        metaState.hasValidConfigFile = true
      }
    }

    return metaState
  }

  const configFileTs = path.resolve(projectRoot, 'cypress.config.ts')
  const configFileJs = path.resolve(projectRoot, 'cypress.config.js')

  if (fs.existsSync(configFileTs)) {
    metaState.hasValidConfigFile = true
    metaState.configFilePath = configFileTs
  }

  if (fs.existsSync(configFileJs)) {
    metaState.hasValidConfigFile = true
    if (metaState.configFilePath) {
      metaState.hasMultipleConfigPaths = true
    } else {
      metaState.configFilePath = configFileJs
    }
  }

  if (!this._configFilePath) {
    this.setConfigFilePath(metaState.hasTypescript ? 'ts' : 'js')
  }

  if (metaState.hasLegacyCypressJson && !metaState.hasValidConfigFile) {
    metaState.needsCypressJsonMigration = true
  }

  return metaState
}

function getPackageManagerUsed (projectRoot: string) {
  if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
    return 'npm'
  }

  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    return 'yarn'
  }

  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }

  return 'npm'
}
