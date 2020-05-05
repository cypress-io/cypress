/* eslint-disable */
import { MountOptions, DefaultMountOptions } from './options'
import { setup as _setup } from './setup'
import { mount as _mount } from './mount'
import { key } from './util/test'

export * from './hooks'

export {
  MountHook,
  MountOptions,
  DefaultMountOptions,
  ComponentTestInstance,
} from './options'

type InjectableComponent<T> = T extends infer U ? U extends { mountComponent: infer C } ? C : any : any

/**  Mount Entry point */
export function mount (component: InjectableComponent<MountOptions>, options: MountOptions = DefaultMountOptions) {
  options = { ...options, ...DefaultMountOptions }

  const componentTestInstance = {
    key: key(),
    options,
    component,
  }

  return _setup(componentTestInstance) // Process options, add styles
  .then((cti) => options.setup(cti)) // DOM exists, target not appended
  .then((cti) => _mount(cti)) // rootEl is available after this point
  .then((cti) => {
    if (cti) {
      options.mount(cti) // target appended, mount component
    }
  })
}


// Other module
declare global {
  namespace CypressComponentUtils {
    interface MountOptionExtensions {
      mountComponent: React.ReactDOM
      react: {
        component: boolean
      }
    }
  }
}

mount({}, {
  react: {
    component: true
  }
})

/** Usage Scratchpad
 * This is how a framework adapter can "hook into" setup, mount, etc...
 * */
/*
// Typescript Rant:
// I wish that I could extend MountOptions and magically
// start treating the options as ReactMountOptions :-)
type ReactMountOptions = MountOptions & {
  react: {
    reactDomToUse: boolean
  }
}

DefaultMountOptions.setup = (cti) => {
  const props = { key: cti.key }
  // cti.options = cti.options as ReactMountOptions // This would be the dream

  // I wish that I could have type completions here
  const reactDomToUse = cti.options.react.reactDomToUse

  //
  // const CypressTestComponent = reactDomToUse.render(
  //   React.createElement(React.Fragment, props, jsx),
  //   el,
  // )

  const CypressTestComponent = `<div>Hello World</div>`

  cy.wrap(CypressTestComponent, { log: false }).as(
    'foo'
  )
}

DefaultMountOptions.mount = () => {}
*/
