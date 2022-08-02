import {
  WIZARD_DEPENDENCY_TYPESCRIPT,
  DependencyToInstall,
  isDependencyInstalled,
} from '@packages/scaffold-config'
import type { DataContext } from '..'

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  async packagesToInstall (): Promise<DependencyToInstall[]> {
    if (!this.ctx.coreData.wizard.chosenFramework || !this.ctx.coreData.wizard.chosenBundler || !this.ctx.currentProject) {
      return []
    }

    const packages: DependencyToInstall[] = [
      ...(await this.ctx.coreData.wizard.chosenFramework.dependencies(
        this.ctx.coreData.wizard.chosenBundler.type, this.ctx.currentProject,
      )),
    ]

    if (this.ctx.lifecycleManager.metaState.isUsingTypeScript) {
      packages.push({
        ...await (isDependencyInstalled(WIZARD_DEPENDENCY_TYPESCRIPT, this.ctx.currentProject)),
        dependency: WIZARD_DEPENDENCY_TYPESCRIPT,
      })
    }

    return packages
  }

  async installDependenciesCommand () {
    const commands = {
      'npm': 'npm install -D',
      'pnpm': 'pnpm install -D',
      'yarn': 'yarn add -D',
    } as const

    const deps = (await this.ctx.wizard.packagesToInstall())
    .filter((pack) => !pack.satisfied)
    .map((pack) => pack.dependency.installer)
    .join(' ')

    if (!deps?.length) {
      return ''
    }

    return `${commands[this.ctx.coreData.packageManager ?? 'npm']} ${deps}`
  }
}
