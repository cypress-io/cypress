export type UIPlugin = {
  name: string
  type: 'devtools'
  initialize: (contentWindow: Window) => void
  mount: (element: HTMLElement) => void
  unmount: () => void
}
