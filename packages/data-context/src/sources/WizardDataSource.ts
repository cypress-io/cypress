import Debug from 'debug'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS } from '@packages/types'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'
import path from 'path'
import resolve from 'resolve-from'

const debug = Debug('cypress:data-context:wizard-data-source')

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  async packagesToInstall (): Promise<Array<NexusGenObjects['WizardNpmPackage']> | null> {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    const packages = [
      {
        name: this.chosenFramework.name as string,
        description: PACKAGES_DESCRIPTIONS[this.chosenFramework.package],
        package: this.chosenFramework.package,
      },
      {
        name: this.chosenBundler.name as string,
        description: PACKAGES_DESCRIPTIONS[this.chosenBundler.package],
        package: this.chosenBundler.package as string,
      },
    ]

    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()
    const { storybookDep } = this.chosenFramework

    if (storybookInfo && storybookDep) {
      packages.push({
        name: storybookDep,
        description: PACKAGES_DESCRIPTIONS[storybookDep],
        package: storybookDep,
      })
    }

    return packages
  }

  async resolvePackagesToInstall (): Promise<string[]> {
    const packagesInitial = await this.packagesToInstall() || []

    if (!this.ctx.currentProject) {
      throw Error('currentProject is not defined')
    }

    debug('packages to install: %O', packagesInitial)

    const installedPackages: (string|null)[] = packagesInitial.map((p) => {
      if (this.ctx.currentProject) {
        debug('package checked: %s', p.package)

        // At startup, node will only resolve the main files of packages it knows of.
        // Adding a package after the app started will not be resolved in the same way.
        // It will only be resolved as a package whose main is `index.js`, ignoring the "main" field
        // to avoid this bug, we resolve a file we know has to be in a node module:
        // `package.json`
        const packageJsonPath = path.join(p.package, 'package.json')

        try {
          resolve(this.ctx.currentProject, packageJsonPath)

          return p.package
        } catch (e) {
          debug('ERROR - resolving package "%s": %O', p.package, e)
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
