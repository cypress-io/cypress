// Maps Cypress's `scrollBehavior` config values to the corresponding
// `ScrollLogicalPosition` accepted by `Element.scrollIntoView`.
export const scrollBehaviorOptionsMap: Record<string, ScrollLogicalPosition> = {
  top: 'start',
  bottom: 'end',
  center: 'center',
  nearest: 'nearest',
}
