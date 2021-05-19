
/// <reference path="../../cli/types/cypress.d.ts" />

declare module 'react-devtools-inline/frontend' {
  export type DevtoolsProps = { browserTheme: 'dark' | 'light'}
  export const initialize: (window: Window) => React.ComponentType<DevtoolsProps>;
}

declare module 'react-devtools-inline/backend' {
  export const initialize: (window: Window) => void
  export const activate: (window: Window) => void
}

declare module "*.scss" { 
  const value: Record<string, string>
  export default value
}