export const ROOT_ID = '__cy_root'

/** Initialize an empty document with root element
 * This only needs for experimentalComponentTesting
*/
export function renderTestingPlatform (headInnerHTML: string) {
  // @ts-expect-error no idea
  const document = cy.state('document')

  if (document.body) document.body.innerHTML = ''

  if (document.head) document.head.innerHTML = headInnerHTML

  const rootNode = document.createElement('div')

  rootNode.setAttribute('id', ROOT_ID)
  document.getElementsByTagName('body')[0].prepend(rootNode)

  return rootNode
}
