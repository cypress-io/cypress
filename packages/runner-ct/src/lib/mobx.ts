import { observer } from 'mobx-react'
import * as React from 'react'

/**
 * Wraps MobX `observer` to properly add a component `displayName` for debugging purposes
 */
// Using `any` as a default generic here has the interesting property of allowing types to properly passthrough, as otherwise the prop type would default to `unknown`
export const namedObserver = <TComponent extends React.ComponentType<TProps>, TProps = any>(displayName: string, component: TComponent): TComponent => {
  component.displayName = displayName

  return observer(component)
}
