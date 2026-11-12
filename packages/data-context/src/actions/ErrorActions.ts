import type { DataContext } from '../DataContext'

export class ErrorActions {
  constructor (private ctx: DataContext) {}

  /**
   * Finds the error from the different possible locations where an can be stored,
   * and nulls it out
   */
  clearError (id: string) {
    this.ctx.update((d) => {
      if (d.diagnostics.error?.id === id) {
        d.diagnostics.error = null
      }
    })
  }

  /**
   * Finds the warning from the different possible locations where warnings can be stored,
   * and removes it from the array
   */
  clearWarning (id: string) {
    this.ctx.update((d) => {
      const warningsIndex = d.diagnostics.warnings.findIndex((v) => v.id === id)

      if (warningsIndex !== -1) {
        d.diagnostics.warnings.splice(warningsIndex, 1)
      }
    })
  }
}
