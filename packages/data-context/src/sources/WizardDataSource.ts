import Debug from 'debug'
import { CODE_LANGUAGES } from '@packages/types'
import {
  AllPackageNames,
  AllPackagePackages,
  BUNDLER_DEPS,
  DEPENDENCIES,
  FRONTEND_FRAMEWORKS,
  PACKAGES_DESCRIPTIONS,
} from '@packages/scaffold-config'
import type { DataContext } from '..'
import path from 'path'
import resolve from 'resolve-from'

const debug = Debug('cypress:data-context:wizard-data-source')

interface PackageToInstall {
  name: AllPackageNames
  description: typeof PACKAGES_DESCRIPTIONS[AllPackagePackages]
  package: AllPackagePackages
  installer: typeof DEPENDENCIES[number]['installer']
}

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  async packagesToInstall (): Promise<PackageToInstall[] | null> {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    const packages: PackageToInstall[] = [
      ...this.chosenFramework.packages.map((pkg) => {
        return {
          name: pkg.name,
          description: PACKAGES_DESCRIPTIONS[pkg.package],
          package: pkg.package,
          installer: pkg.installer,
        }
      }),
      {
        name: this.chosenBundler.name,
        description: PACKAGES_DESCRIPTIONS[this.chosenBundler.package],
        package: this.chosenBundler.package,
        installer: this.chosenBundler.installer,
      },
    ]

    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()
    const { storybookDep } = this.chosenFramework

    if (storybookInfo && storybookDep) {
      packages.push({
        name: storybookDep.name,
        installer: storybookDep.installer,
        package: storybookDep.package,
        description: PACKAGES_DESCRIPTIONS[storybookDep.package],
      })
    }

    return packages
  }

  async installDependenciesCommand () {
    const commands = {
      'npm': 'npm install -D',
      'pnpm': 'pnpm install -D',
      'yarn': 'yarn add -D',
    }

    let depsToInstall = (await this.ctx.wizard.packagesToInstall() ?? [])

    if (!depsToInstall?.length) {
      return null
    }

    const deps = depsToInstall.map((pack) => `${pack.installer}`).join(' ')

    return `${commands[this.ctx.coreData.packageManager ?? 'npm']} ${deps}`
  }

  async installedPackages (): Promise<string[]> {
    if (this.ctx.coreData.wizard.__fakeInstalledPackagesForTesting) {
      return this.ctx.coreData.wizard.__fakeInstalledPackagesForTesting
    }

    const packagesInitial = await this.packagesToInstall() || []

    if (!this.ctx.currentProject) {
      throw Error('currentProject is not defined')
    }

    debug('packages to install: %O', packagesInitial)

    const installedPackages: Array<string | null> = packagesInitial.map((p) => {
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
    return BUNDLER_DEPS.find((f) => f.type === this.ctx.wizardData.chosenBundler) || null
  }

  get chosenLanguage () {
    return CODE_LANGUAGES.find((f) => f.type === this.ctx.wizardData.chosenLanguage) || null
  }
}
