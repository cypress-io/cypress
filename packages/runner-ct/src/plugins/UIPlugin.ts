export type UIPlugin = {
  name: string
  type: 'devtools'
  initialize: (contentWindow: Window) => void
  mount: () => void
  unmount: () => void
}
