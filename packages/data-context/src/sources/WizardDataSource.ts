import {
  WIZARD_DEPENDENCY_TYPESCRIPT,
  DependencyToInstall,
  inPkgJson,
} from '@packages/scaffold-config'
import type { DataContext } from '..'

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  packagesToInstall (): DependencyToInstall[] {
    if (!this.ctx.coreData.wizard.chosenFramework || !this.ctx.coreData.wizard.chosenBundler || !this.ctx.currentProject) {
      return []
    }

    const packages: DependencyToInstall[] = [
      ...this.ctx.coreData.wizard.chosenFramework.dependencies(
        this.ctx.coreData.wizard.chosenBundler.type, this.ctx.currentProject,
      ),
    ]

    if (this.ctx.coreData.wizard.chosenLanguage === 'ts') {
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

    const deps = this.ctx.wizard.packagesToInstall()
    .filter((pack) => !pack.satisfied)
    .map((pack) => pack.dependency.installer)
    .join(' ')

    if (!deps?.length) {
      return ''
    }

    return `${commands[this.ctx.coreData.packageManager ?? 'npm']} ${deps}`
  }
}
