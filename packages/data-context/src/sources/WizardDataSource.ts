import Debug from 'debug'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS, PackageJson } from '@packages/types'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'
import path from 'path'
import resolve from 'resolve-from'
import { detectVariant } from '../util/detectDepsToInstall'

const debug = Debug('cypress:data-context:wizard-data-source')

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  async packagesToInstall (): Promise<Array<NexusGenObjects['WizardNpmPackage']> | null> {
    if (!this.ctx.currentProject || !this.chosenFramework || !this.chosenBundler) {
      return null
    }

    let hasPackageJson = true

    try {
      await this.ctx.fs.access(path.join(this.ctx.currentProject, 'package.json'), this.ctx.fs.constants.R_OK)
    } catch (e) {
      debug('Could not read or find package.json: %O', e)
      hasPackageJson = false
    }
    const packageJson: PackageJson = hasPackageJson ? await this.ctx.fs.readJson(path.join(this.ctx.currentProject, 'package.json')) : {}
    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()

    const variant = detectVariant(packageJson || {},
      {
        framework: this.chosenFramework,
        bundler: this.chosenBundler,
      })

    if (variant.supportsStorybook && storybookInfo) {
      return [...variant.depsToInstall, this.chosenFramework.storybookDep]
    }

    return [...variant.depsToInstall]
  }

  async resolvePackagesToInstall (): Promise<string[]> {
    const packagesInitial = await this.packagesToInstall() || []

    if (!this.ctx.currentProject) {
      throw Error('currentProject is not defined')
    }

    debug('packages to install: %O', packagesInitial)

    const installedPackages: (string|null)[] = packagesInitial.map((p) => {
      if (this.ctx.currentProject) {
        debug('package checked: %s', p.name)

        // At startup, node will only resolve the main files of packages it knows of.
        // Adding a package after the app started will not be resolved in the same way.
        // It will only be resolved as a package whose main is `index.js`, ignoring the "main" field
        // to avoid this bug, we resolve a file we know has to be in a node module:
        // `package.json`
        const packageJsonPath = path.join(p.name, 'package.json')

        try {
          resolve(this.ctx.currentProject, packageJsonPath)

          return p.name
        } catch (e) {
          debug('ERROR - resolving package "%s": %O', p.name, e)
        }
      }

      return null
    })

    return installedPackages.filter((p) => p !== null) as string[]
  }

  get chosenFramework () {
    return FRONTEND_FRAMEWORKS.find((f) => f.type === this.ctx.wizardData.chosenFramework) || null
  }

  get chosenBundler () {
    return BUNDLERS.find((f) => f.type === this.ctx.wizardData.chosenBundler) || null
  }

  get chosenLanguage () {
    return CODE_LANGUAGES.find((f) => f.type === this.ctx.wizardData.chosenLanguage) || null
  }
}
