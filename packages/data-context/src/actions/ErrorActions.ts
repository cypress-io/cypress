import type { DataContext } from '../DataContext'

export class ErrorActions {
  constructor (private ctx: DataContext) {}

  /**
   * Finds the error from the different possible locations where an can be stored,
   * and nulls it out
   */
  clearError (id: string) {
    this.ctx.update((d) => {
      if (d.currentProjectData?.testingTypeData?.activeAppData?.error?.id === id) {
        d.currentProjectData.testingTypeData.activeAppData.error = null
      }

      if (d.currentProjectData?.testingTypeData?.error?.id === id) {
        d.currentProjectData.testingTypeData.error = null
      }

      if (d.currentProjectData?.error?.id === id) {
        d.currentProjectData.error = null
      }

      if (d.baseError?.id === id) {
        d.baseError = null
      }
    })
  }

  /**
   * Finds the warning from the different possible locations where warnings can be stored,
   * and removes it from the array
   */
  clearWarning (id: string) {
    this.ctx.update((d) => {
      const warningsIndex = d.warnings.findIndex((v) => v.id === id)

      if (warningsIndex != null && warningsIndex !== -1) {
        d.warnings.splice(warningsIndex, 1)

        return
      }

      const projectWarningsIndex = d.currentProjectData?.warnings.findIndex((v) => v.id === id)

      if (projectWarningsIndex != null && projectWarningsIndex !== -1) {
        d.currentProjectData?.warnings.splice(projectWarningsIndex, 1)

        return
      }

      const testingTypeWarningsIndex = d.currentProjectData?.testingTypeData?.warnings.findIndex((v) => v.id === id)

      if (testingTypeWarningsIndex != null && testingTypeWarningsIndex !== -1) {
        d.currentProjectData?.testingTypeData?.warnings.splice(testingTypeWarningsIndex, 1)

        return
      }

      const appWarningsIndex = d.currentProjectData?.testingTypeData?.activeAppData?.warnings.findIndex((v) => v.id === id)

      if (appWarningsIndex != null && appWarningsIndex !== -1) {
        d.currentProjectData?.testingTypeData?.activeAppData?.warnings.splice(appWarningsIndex, 1)
      }
    })
  }
}
