import path from 'path'
import fs from 'fs-extra'
import type { DataContext } from '..'
import {
  moveSpecFiles,
  NonStandardMigrationError,
  SpecToMove,
  supportFilesForMigration,
} from '../util'
import type { TestingType } from '@packages/types'

export class MigrationActions {
  constructor (private ctx: DataContext) { }

  async createConfigFile () {
    const config = await this.ctx.migration.createConfigString()

    await this.ctx.actions.file.writeFileInProject('cypress.config.js', config).catch((error) => {
      throw error
    })

    await this.ctx.actions.file.removeFileInProject('cypress.json').catch((error) => {
      throw error
    })
  }

  initialize () {
    return this.ctx.migration.initialize()
  }

  async renameSpecFiles (beforeSpecs: string[], afterSpecs: string[]) {
    if (!this.ctx.currentProject) {
      throw Error('Need to set currentProject before you can rename files')
    }

    const specsToMove: SpecToMove[] = []

    for (let i = 0; i < beforeSpecs.length; i++) {
      const from = beforeSpecs[i]
      const to = afterSpecs[i]

      if (!from || !to) {
        throw Error(`Must have matching to and from. Got from: ${from} and to: ${to}`)
      }

      specsToMove.push({ from, to })
    }

    const projectRoot = this.ctx.path.join(this.ctx.currentProject)

    moveSpecFiles(projectRoot, specsToMove)
  }

  async renameSupportFile () {
    if (!this.ctx.currentProject) {
      throw Error(`Need current project before starting migration!`)
    }

    const result = await supportFilesForMigration(this.ctx.currentProject)

    const beforeRelative = result.before.relative
    const afterRelative = result.after.relative

    if (!beforeRelative || !afterRelative) {
      throw new NonStandardMigrationError('support')
    }

    fs.renameSync(
      path.join(this.ctx.currentProject, beforeRelative),
      path.join(this.ctx.currentProject, afterRelative),
    )
  }

  async startWizardReconfiguration (type?: TestingType) {
    this.ctx.lifecycleManager.initializeConfigWatchers()
    this.ctx.lifecycleManager.refreshMetaState()
    if (type) {
      this.ctx.lifecycleManager.setCurrentTestingType(type)
    }
  }

  async nextStep () {
    const filteredSteps = this.ctx.migration.filteredSteps
    const index = filteredSteps.indexOf(this.ctx.migration.step)

    if (index === -1) {
      throw new Error('Invalid step')
    }

    const nextIndex = index + 1

    if (nextIndex < filteredSteps.length) {
      const nextStep = filteredSteps[nextIndex]

      if (nextStep) {
        this.ctx.migration.setStep(nextStep)
      }
    } else {
      await this.startWizardReconfiguration()
    }
  }
}
