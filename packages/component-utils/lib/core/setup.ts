import { ComponentTestInstance, MountOptions } from './options'
import { handleError } from './errors'
import { getRoot, getDocument } from './util/dom'
import { injectStylesBeforeElement } from './util/styles'

function checkMountModeEnabled () {
  if (Cypress.spec.specType !== 'component') {
    throw new Error(
      `In order to use mount or unmount functions please place the spec in component folder`,
    )
  }
}

const injectGlobalStyles = (options: MountOptions, _document: Document = getDocument()) => {
  const el: HTMLElement | null = getRoot(options.rootId, _document)

  if (el === null) return handleError() // short circuit to avoid null checks

  return injectStylesBeforeElement(options, _document, el)
}

export function setup (componentTestInstance: ComponentTestInstance) {
  const { options } = componentTestInstance

  if (options.mountModeEnabled) checkMountModeEnabled()

  return cy
  .then(() => injectGlobalStyles(options))
  .then(() => componentTestInstance)
}
