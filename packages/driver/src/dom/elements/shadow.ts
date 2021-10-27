import $ from 'jquery'

export const isShadowRoot = (maybeRoot) => {
  return maybeRoot?.toString() === '[object ShadowRoot]'
}

export const isWithinShadowRoot = (node: HTMLElement) => {
  return isShadowRoot(node.getRootNode())
}

// if the node has a shadow root, we must behave like
// the browser and find the inner element of the shadow
// root at that same point.
export const getShadowElementFromPoint = (node, x, y) => {
  const nodeFromPoint = node?.shadowRoot?.elementFromPoint(x, y)

  if (!nodeFromPoint || nodeFromPoint === node) return node

  return getShadowElementFromPoint(nodeFromPoint, x, y)
}

export const getShadowRoot = ($el: JQuery): JQuery<Node> => {
  const root = $el[0].getRootNode()

  return $(root)
}

export const findAllShadowRoots = (root: Node): Node[] => {
  const collectRoots = (roots, nodes, node) => {
    const currentRoot = roots.pop()

    if (!currentRoot) return nodes

    const childRoots = findShadowRoots(currentRoot)

    if (childRoots.length > 0) {
      roots.push(...childRoots)
      nodes.push(...childRoots)
    }

    return collectRoots(roots, nodes, currentRoot)
  }

  return collectRoots([root], [], root)
}

const findShadowRoots = (root: Node): Node[] => {
  // get the document for this node
  const doc = root.getRootNode({ composed: true }) as Document
  // create a walker for efficiently traversing the
  // dom of this node
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_DOCUMENT_FRAGMENT, {
    acceptNode (node) {
      // we only care about nodes which have a shadow root
      if ((node as Element).shadowRoot) {
        return NodeFilter.FILTER_ACCEPT
      }

      // we skip other nodes, but continue to traverse their children
      return NodeFilter.FILTER_SKIP
    },
  })

  const roots: Node[] = []
  const rootAsElement = root as Element

  if (rootAsElement.shadowRoot) {
    roots.push(rootAsElement.shadowRoot)
  }

  const collectRoots = (roots) => {
    const nextNode = walker.nextNode() as Element

    if (!nextNode) return roots

    return collectRoots(roots.concat(nextNode.shadowRoot))
  }

  return collectRoots(roots)
}
