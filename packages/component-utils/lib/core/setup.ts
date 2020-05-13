import { ComponentTestInstance, MountOptions } from './options'
import { handleError } from './errors'
import { getRoot, getDocument } from './util/dom'
import { injectStylesBeforeElement } from './util/styles'

function checkMountModeEnabled () {
  // @ts-ignore
  if (Cypress.spec.specType !== 'component') {
    throw new Error(
      `In order to use mount or unmount functions please place the spec in the component folder defined in cypress.json`,
    )
  }
}

const injectGlobalStyles = (options: MountOptions, _document: Document = getDocument()) => {
  const el: HTMLElement | null = getRoot(options.rootId, _document)

  if (el === null) return handleError() // short circuit to avoid null checks

  return injectStylesBeforeElement(options, _document, el)
}

/**
 * Setup prepares the document for mounting
 * Handles things like style injection
 * @param componentTestInstance
 */
export function setup (componentTestInstance: ComponentTestInstance) {
  const { options } = componentTestInstance

  if (options.mountModeEnabled) checkMountModeEnabled()

  return cy
  .then(() => injectGlobalStyles(options))
  .then(() => componentTestInstance)
}
