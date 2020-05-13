import { MountOptions, defaultMountOptions } from './options'
import { setup as _setup } from './setup'
import { mount as _mount } from './mount'
import { key } from './util/test'

export * from './hooks'

export {
  MountHook,
  MountOptions,
  defaultMountOptions,
  ComponentTestInstance,
} from './options'

/**
 * Allow Dependency Injection of Types by the Component Utils consumer
 * This allows React-specific and Vue-specific framework options
 * as well as properly typed components
 *
 * InjectableComponent will receive any PluginConfig (framework specific)
 * and try to type the mountComponent option correctly
 *
 * @example
 * declare global {
 *   namespace CypressComponentUtils {lmk
 *     interface MountOptionExtensions {
 *       mountComponent?: React.ReactDom
 *       react: {
 *         reactSpecificOption: boolean
 *       }
 *     }
 *   }
 * }
 */
type InjectableComponent<PluginConfig> =
    PluginConfig extends { mountComponent: infer FrameworkSpecificComponent }
        ? FrameworkSpecificComponent
        : any

/**  Mount Entry point */
export function mount (component: InjectableComponent<MountOptions>, options: MountOptions = defaultMountOptions) {
  options = { ...options, ...defaultMountOptions }

  const componentTestInstance = {
    key: key(),
    options,
    component,
  }

  return _setup(componentTestInstance) // Process options, add styles
  .then((cti) => typeof options.setup === 'function' && options.setup(cti)) // DOM exists, target not appended
  .then((cti) => _mount(cti)) // rootEl is available after this point
  .then((cti) => {
    if (cti && typeof options.mount === 'function') {
      return options.mount(cti) // target appended, mount component
    }
  })
}
