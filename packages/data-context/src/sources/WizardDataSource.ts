import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS } from '@packages/types'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'

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
