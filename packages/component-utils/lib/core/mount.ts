import { ComponentTestInstance } from './options'
import { getRoot } from './util/dom'
import { handleError } from './errors'

/**
 * Mounts the target
 * RootEl is present on the ComponentTestInstance after this point
 * @param componentTestInstance
 */
export async function mount (componentTestInstance: ComponentTestInstance) {
  const rootEl = getRoot(componentTestInstance.options.rootId)

  if (rootEl === null) return handleError()

  componentTestInstance.rootEl = rootEl

  return componentTestInstance
}
