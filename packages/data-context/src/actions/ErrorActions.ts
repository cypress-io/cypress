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
        d.baseError === null
      }
    })
  }

  /**
   * Finds the warning from the different possible locations where warnings can be stored,
   * and removes it from the array
   */
  clearWarning (id: string) {
    this.ctx.update((d) => {
      const idxA = d.warnings.findIndex((v) => v.id === id)

      if (idxA != null && idxA !== -1) {
        d.warnings.splice(idxA, 1)

        return
      }

      const idxB = d.currentProjectData?.warnings.findIndex((v) => v.id === id)

      if (idxB != null && idxB !== -1) {
        d.currentProjectData?.warnings.splice(idxB, 1)

        return
      }

      const idxC = d.currentProjectData?.testingTypeData?.warnings.findIndex((v) => v.id === id)

      if (idxC != null && idxC !== -1) {
        d.currentProjectData?.testingTypeData?.warnings.splice(idxC, 1)

        return
      }

      const idxD = d.currentProjectData?.testingTypeData?.activeAppData?.warnings.findIndex((v) => v.id === id)

      if (idxD != null && idxD !== -1) {
        d.currentProjectData?.testingTypeData?.activeAppData?.warnings.splice(idxD, 1)
      }
    })
  }
}
