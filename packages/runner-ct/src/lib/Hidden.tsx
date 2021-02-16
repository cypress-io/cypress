import * as React from 'react'

export type HiddenProps<TProps, TComponent extends React.ElementType<TProps>> = {
  hidden: boolean
  type: 'layout' | 'visual'
  component?: TComponent
} & TProps

export const Hidden = React.forwardRef(
  function VisuallyHidden<TProps, TComponent extends React.ElementType<TProps>> ({
    hidden,
    type,
    component: Component = 'div',
    style,
    ...props
  }: HiddenProps<TProps, TComponent>, ref: React.Ref<TComponent>) {
    const styleProp = type === 'layout'
      ? { display: hidden ? 'none' : 'block' }
      : { visibility: hidden ? 'hidden' : 'visible' }

    return (
      <Component ref={ref} style={{ ...style, ...styleProp }} {...props} />
    )
  },
) as <TProps, TComponent extends React.ElementType<TProps>>(props: HiddenProps<TProps, TComponent>) => JSX.Element
