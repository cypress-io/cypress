import { defaultMountOptions } from '../options'
const { rootId } = defaultMountOptions

export function getRoot (id = rootId, _document: Document = getDocument()): HTMLElement | null {
  return _document.getElementById(id)
}

export function getDocument (): Document {
  return cy.get('document') as unknown as Document
}

export function renderTarget (_document: Document = getDocument()) {
  const rootNode = _document.createElement('div')

  rootNode.setAttribute('id', rootId)
  _document.getElementsByTagName('body')[0].prepend(rootNode)

  return cy.get(`#${rootId}`, { log: false })
}

export function renderTargetIfNotExists () {
  return getRoot() || renderTarget()
}
