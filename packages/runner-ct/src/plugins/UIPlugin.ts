export type UIPlugin = {
  name: string
  type: 'devtools'
  initialize?: (contentWindow: Window) => void
  mount?: () => void
  unmount?: () => void
  afterTest?: (spec: Cypress.Cypress['spec']) => void
  beforeTest?: (spec: Cypress.Cypress['spec']) => void
}
