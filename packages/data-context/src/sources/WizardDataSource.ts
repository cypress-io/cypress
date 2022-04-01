import Debug from 'debug'
import { CODE_LANGUAGES } from '@packages/types'
import {
  WizardDependency,
  WIZARD_BUNDLERS,
  WIZARD_FRAMEWORKS,
  WIZARD_DEPENDENCY_TYPESCRIPT,
  DependencyToInstall,
  inPkgJson
} from '@packages/scaffold-config'
import type { DataContext } from '..'
import path from 'path'
import resolve from 'resolve-from'
import fs from 'fs-extra'

const debug = Debug('cypress:data-context:wizard-data-source')

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  packagesToInstall (): DependencyToInstall[] {
    if (!this.chosenFramework || !this.chosenBundler || !this.ctx.currentProject) {
      return []
    }

    // const pkg = fs.readJsonSync(path.posix.join(this.ctx.currentProject, 'package.json'))

    const packages: DependencyToInstall[] = [...this.chosenFramework.dependencies(this.chosenBundler.type, this.ctx.currentProject)]

    if (this.chosenLanguage?.type === 'ts') {
      packages.push({
        ...inPkgJson(WIZARD_DEPENDENCY_TYPESCRIPT, this.ctx.currentProject),
        dependency: WIZARD_DEPENDENCY_TYPESCRIPT,
      })
    }

    // TODO: Storybook support.
    // const storybookInfo = await this.ctx.storybook.loadStorybookInfo()

    // if (storybookInfo && this.chosenFramework.storybookDep) {
    //   packages.push(this.chosenFramework.storybookDep)
    // }

    return packages
  }

  installDependenciesCommand () {
    const commands = {
      'npm': 'npm install -D',
      'pnpm': 'pnpm install -D',
      'yarn': 'yarn add -D',
    } as const

    const deps = this.ctx.wizard.packagesToInstall().map((pack) => `${pack.dependency.package}`).join(' ')


    if (!deps?.length) {
      return ''
    }

    return `${commands[this.ctx.coreData.packageManager ?? 'npm']} ${deps}`
  }

  get chosenFramework () {
    return WIZARD_FRAMEWORKS.find((f) => f.type === this.ctx.wizardData.chosenFramework) || null
  }

  get chosenBundler () {
    return WIZARD_BUNDLERS.find((f) => f.type === this.ctx.wizardData.chosenBundler) || null
  }

  get chosenLanguage () {
    return CODE_LANGUAGES.find((f) => f.type === this.ctx.wizardData.chosenLanguage) || null
  }
}
