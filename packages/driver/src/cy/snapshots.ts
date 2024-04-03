import $ from 'jquery'
import _ from 'lodash'
import type { $Cy } from '../cypress/cy'
import type { StateFunc } from '../cypress/state'
import $dom from '../dom'
import { create as createSnapshotsCSS } from './snapshots_css'
import { finder } from '@medv/finder'

export const HIGHLIGHT_ATTR = 'data-cypress-el'

export const FINAL_SNAPSHOT_NAME = 'final state'

type SelectorNode = {
  frameId?: string
  selector: string
  ownerDoc: Document | ShadowRoot
  host?: SelectorNode
}

const returnShadowRootIfShadowDomNode = (node: Element): ShadowRoot | null => {
  // the shadowRoot object property only lives on the node context OUTSIDE the shadow DOM, meaning that
  // node.parentNode.host.shadowRoot works. Oddly, this is considered an instance of an Object and not
  // a ShadowRoot, so checking for the shadowRoot on the host property is likely safe.
  const isNodeShadowRoot = (n: any) => !!n?.host?.shadowRoot

  let parent = node && node.parentNode

  while (parent) {
    if (isNodeShadowRoot(parent)) {
      return parent as ShadowRoot
    }

    parent = parent.parentNode
  }

  return null
}

function findSelectorForElement (elem: Element, root: Document | ShadowRoot) {
  // finder tries to find the shortest unique selector to an element,
  // but since we are more concerned with speed, we set the threshold to 1 and maxNumberOfTries to 0
  // @see https://github.com/antonmedv/finder/issues/75
  return finder(elem, { root: root as unknown as Element, threshold: 1, maxNumberOfTries: 0 })
}

/**
 * Builds a recursive structure of selectors in order to re-identify during Test Replay.
 *
 * @param elem - an HTML Element that lives within the shadow DOM or the regular DOM
 * @returns SelectorNode if the selector can be discovered. For regular elements, this should only be one object deep, but for shadow DOM
 * elements, the SelectorNode tree could be N levels deep until the root is discovered
 */
function constructElementSelectorTree (elem: Element): SelectorNode | undefined {
  try {
    const ownerDoc = elem.ownerDocument
    const elWindow = ownerDoc.defaultView

    if (elWindow === null) {
      return undefined
    }

    // finder will return a string if it can find the selector.
    // otherwise, an error will throw and we will fall back to shadowDom lookup.
    const selector = findSelectorForElement(elem, ownerDoc)

    const frameId = elWindow['__cypressProtocolMetadata']?.frameId

    return { selector, frameId, ownerDoc: elem.ownerDocument, host: undefined }
  } catch {
    // the element may not always be found since it's possible for the element to be removed from the DOM
    // Or maybe its in the shadow DOM.
    // If it is a shadow DOM element, return the ShadowRoot as well to relate the node to the root document
    try {
      const shadowRoot = returnShadowRootIfShadowDomNode(elem)

      // If we have a shadow DOM element, get the frameId and unique selector of the ShadowRoot
      // see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot
      if (shadowRoot) {
        // Look up the details of the shadowRoot to see which element the ShadowRoot is bound to, i.e. the host.
        const hostDetails = constructElementSelectorTree(shadowRoot.host)

        // look up our element inside the context of the ShadowRoot
        const selectorFromShadowWorld = findSelectorForElement(elem, shadowRoot)

        // gives us enough information to associate the shadow element to the ShadowRoot/host to reconstruct in Test Replay
        return { selector: selectorFromShadowWorld, frameId: undefined, ownerDoc: shadowRoot, host: hostDetails }
      }
    } catch {
      return undefined
    }
  }

  return undefined
}

export const create = ($$: $Cy['$$'], state: StateFunc) => {
  const snapshotsCss = createSnapshotsCSS($$, state)
  const snapshotsMap = new WeakMap()
  const snapshotDocument = new Document()

  const getHtmlAttrs = function (htmlEl) {
    const tmpHtmlEl = document.createElement('html')

    return _.transform(htmlEl?.attributes, (memo, attr) => {
      if (!attr.specified) {
        return
      }

      try {
        // if we can successfully set the attributethen set it on memo
        // because it's possible the attribute is completely invalid
        tmpHtmlEl.setAttribute(attr.name, attr.value)
        memo[attr.name] = attr.value
      } catch (error) { } // eslint-disable-line no-empty
    }, {})
  }

  const replaceIframes = (body) => {
    // remove iframes because we don't want extra requests made, JS run, etc
    // when restoring a snapshot
    // replace them so the lack of them doesn't cause layout issues
    // use <iframe>s as the placeholders because iframes are inline, replaced
    // elements (https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element)
    // so it's hard to simulate their box model
    // attach class names and inline styles, so that CSS styles are applied
    // as they would be on the user's page, but override some
    // styles so it looks like a placeholder

    // need to only replace the iframes in the cloned body, so grab those
    const $iframes = body.find('iframe')
    // but query from the actual document, since the cloned body
    // iframes don't have proper styles applied

    return $$('iframe').each((idx, iframe) => {
      const $iframe = $(iframe)

      const remove = () => {
        return $iframes.eq(idx).remove()
      }

      // if we don't have access to window
      // then just remove this $iframe...
      try {
        if (!$iframe.prop('contentWindow')) {
          return remove()
        }
      } catch (error) {
        return remove()
      }

      const props = {
        id: iframe.id,
        class: iframe.className,
        style: iframe.style.cssText,
      }

      const dimensions = (fn) => {
        // jquery may throw here if we accidentally
        // pass an old iframe reference where the
        // document + window properties are unavailable
        try {
          return $iframe[fn]()
        } catch (e) {
          return 0
        }
      }

      const $placeholder = $('<iframe />', props).css({
        background: '#f8f8f8',
        border: 'solid 1px #a3a3a3',
        boxSizing: 'border-box',
        padding: '20px',
        width: dimensions('outerWidth'),
        height: dimensions('outerHeight'),
      }) as JQuery<HTMLIFrameElement>

      $iframes.eq(idx).replaceWith($placeholder)
      const contents = `\
<style>
  p { color: #888; font-family: sans-serif; line-height: 1.5; }
</style>
<p>&lt;iframe&gt; placeholder for ${iframe.src}</p>\
`

      $placeholder[0].src = `data:text/html;base64,${window.btoa(contents)}`
    })
  }

  const getStyles = (snapshot) => {
    const { ids, styles } = snapshotsMap.get(snapshot) || {}

    if (!ids && !styles) {
      return {}
    }

    // If a cross origin processed snapshot, styles are directly added into the CSS map. Simply return them.
    if (styles?.headStyles || styles?.bodyStyles) {
      return styles
    }

    return {
      headStyles: snapshotsCss.getStylesByIds(ids?.headStyleIds),
      bodyStyles: snapshotsCss.getStylesByIds(ids?.bodyStyleIds),
    }
  }

  const detachDom = (iframeContents) => {
    const { headStyleIds, bodyStyleIds } = snapshotsCss.getStyleIds()
    const htmlAttrs = getHtmlAttrs(iframeContents.find('html')[0])
    const $body = iframeContents.find('body')

    $body.find('script,link[rel="stylesheet"],style').remove()

    const snapshot = {
      name: FINAL_SNAPSHOT_NAME,
      htmlAttrs,
      body: {
        get: () => $body.detach(),
      },
    }

    snapshotsMap.set(snapshot, {
      ids: {
        headStyleIds,
        bodyStyleIds,
      },
    })

    return snapshot
  }

  const createSnapshotBody = ($elToHighlight) => {
    // create a unique selector for this el
    // but only IF the subject is truly an element. For example
    // we might be wrapping a primitive like "$([1, 2]).first()"
    // which arrives here as number 1
    // jQuery v2 allowed to silently try setting 1[HIGHLIGHT_ATTR] doing nothing
    // jQuery v3 runs in strict mode and throws an error if you attempt to set a property

    const shouldHighlightElement = isJqueryElement($elToHighlight)

    if (shouldHighlightElement) {
      ($elToHighlight as JQuery<HTMLElement>).attr(HIGHLIGHT_ATTR, 'true')
    }

    // TODO: throw error here if cy is undefined!

    // cloneNode can actually trigger functions attached to custom elements
    // so we have to use importNode to clone the element
    // https://github.com/cypress-io/cypress/issues/7187
    // https://github.com/cypress-io/cypress/issues/1068
    // we import it to a transient document (snapshotDocument) so that there
    // are no side effects from cloning it. see below for how we re-attach
    // it to the AUT document
    // https://github.com/cypress-io/cypress/issues/8679
    // this can fail if snapshotting before the page has fully loaded,
    // so we catch this below and return null for the snapshot
    // https://github.com/cypress-io/cypress/issues/15816
    const $body = $$(snapshotDocument.importNode($$('body')[0], true))
    // for the head and body, get an array of all CSS,
    // whether it's links or style tags
    // if it's same-origin, it will get the actual styles as a string
    // if it's cross-origin, it will get a reference to the link's href
    const { headStyleIds, bodyStyleIds } = snapshotsCss.getStyleIds()

    // replaces iframes with placeholders
    replaceIframes($body)

    // remove tags we don't want in body
    $body.find('script,link[rel=\'stylesheet\'],style').remove()

    // here we need to figure out if we're in a remote manual environment
    // if so we need to stringify the DOM:
    // 1. grab all inputs / textareas / options and set their value on the element
    // 2. convert DOM to string: body.prop("outerHTML")
    // 3. send this string via websocket to our server
    // 4. server rebroadcasts this to our client and its stored as a property

    // its also possible for us to store the DOM string completely on the server
    // without ever sending it back to the browser (until its requests).
    // we could just store it in memory and wipe it out intelligently.
    // this would also prevent having to store the DOM structure on the client,
    // which would reduce memory, and some CPU operations

    // now remove it after we clone
    if (shouldHighlightElement) {
      ($elToHighlight as JQuery<HTMLElement>).removeAttr(HIGHLIGHT_ATTR)
    }

    const $htmlAttrs = getHtmlAttrs($$('html')[0])

    return {
      $body,
      $htmlAttrs,
      headStyleIds,
      bodyStyleIds,
    }
  }

  const reifySnapshotBody = (preprocessedSnapshot) => {
    const $body = preprocessedSnapshot.body.get()
    const $htmlAttrs = preprocessedSnapshot.htmlAttrs
    const { headStyles, bodyStyles } = preprocessedSnapshot.styles

    return {
      $body,
      $htmlAttrs,
      headStyles,
      bodyStyles,
    }
  }

  const isJqueryElement = ($el) => {
    // TODO: in firefox sometimes this throws a cross-origin access error
    return $dom.isElement($el) && $dom.isJquery($el)
  }

  const buildSelectorArray = (el: HTMLElement) => {
    // flatten selector to only include selector string values, which we can imply is a shadowRoot if other values exist in the tree
    // this keeps the structure similar to axe-core
    // @see https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#results-object -> target
    const selectors: string[] | undefined = []
    let frameId: string | undefined
    const flattenElementSelectorTree = (el: SelectorNode | undefined): void => {
      if (el) {
        selectors.unshift(el?.selector)

        if (el?.host) {
          flattenElementSelectorTree(el.host)
        } else {
          frameId = el.frameId
        }
      }
    }

    const elToHighlight = constructElementSelectorTree(el)

    flattenElementSelectorTree(elToHighlight)

    let selector: string | string[] | undefined

    switch (selectors.length) {
      case 0:
        selector = undefined
        break
      case 1:
        selector = selectors[0]
        break
      default:
        selector = selectors
    }

    return selector ? [{
      selector,
      frameId,
    }] : []
  }

  const createSnapshot = (name, $elToHighlight, preprocessedSnapshot) => {
    Cypress.action('cy:snapshot', name)
    // when using cy.origin() and in a transitionary state, state('document')
    // can be undefined, resulting in a bizarre snapshot of the entire Cypress
    // UI. better not to take the snapshot in that case.
    // https://github.com/cypress-io/cypress/issues/24506
    // also, do not take the snapshot here if it has already been taken and
    // preprocessed in a spec bridge.
    if (!preprocessedSnapshot && !state('document')) {
      return null
    }

    const timestamp = performance.now() + performance.timeOrigin

    // if the protocol has been enabled, our snapshot is just the name, timestamp, and highlighted elements,
    // also make sure numTestsKeptInMemory is 0, otherwise we will want the full snapshot
    // (the driver test's set numTestsKeptInMemory to 1 in run mode to verify the snapshots)
    if (Cypress.config('protocolEnabled') && Cypress.config('numTestsKeptInMemory') === 0) {
      const snapshot: {
        name: string
        timestamp: number
        elementsToHighlight?: {
          selector: string | string []
          frameId: string
        }[]
      } = { name, timestamp }

      if (isJqueryElement($elToHighlight)) {
        snapshot.elementsToHighlight = $dom.unwrap($elToHighlight).flatMap((el: HTMLElement) => buildSelectorArray(el))
      }

      Cypress.action('cy:protocol-snapshot')

      return snapshot
    }

    try {
      const {
        $body,
        $htmlAttrs,
        ...styleAttrs
      } = preprocessedSnapshot ? reifySnapshotBody(preprocessedSnapshot) : createSnapshotBody($elToHighlight)

      let attachedBody
      const body = {
        get: () => {
          if (!attachedBody) {
            // logs streaming in from the secondary need to be cloned off a document,
            // which means state("document") will be undefined in the primary
            // if a cy.origin block is active

            // this could also be possible, but unlikely, if the spec bridge is taking
            // snapshots before the document has loaded into state, as could be the case with logs
            // generated from before:load event handlers in a spec bridge

            // in any of these cases, fall back to the root document as we only
            // need the document to clone the node.
            const doc = state('document') || window.document

            attachedBody = $$(doc.adoptNode($body[0]))
          }

          return attachedBody
        },
      }

      const snapshot = {
        name,
        timestamp,
        htmlAttrs: $htmlAttrs,
        body,
      }

      const {
        headStyleIds,
        bodyStyleIds,
        headStyles,
        bodyStyles,
      }: {
        headStyleIds?: string[]
        bodyStyleIds?: string[]
        headStyles?: string[]
        bodyStyles?: string[]
      } = styleAttrs

      if (headStyleIds && bodyStyleIds) {
        snapshotsMap.set(snapshot, {
          ids: {
            headStyleIds,
            bodyStyleIds,
          },
        })
      } else if (headStyles && bodyStyles) {
        // The Snapshot is being reified from cross origin. Get inline styles of reified snapshot.
        snapshotsMap.set(snapshot, {
          styles: {
            headStyles,
            bodyStyles,
          },
        })
      }

      return snapshot
    } catch (e) {
      return null
    }
  }

  return {
    createSnapshot,
    detachDom,
    getStyles,
    onCssModified: snapshotsCss.onCssModified,
    onBeforeWindowLoad: snapshotsCss.onBeforeWindowLoad,
  }
}

export interface ISnapshots extends ReturnType<typeof create> {}
