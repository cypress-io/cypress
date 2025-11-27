import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import { blankContents } from '../components/Blank'
import { logger } from './logger'
import _ from 'lodash'
/* eslint-disable no-duplicate-imports */
import type { DebouncedFunc } from 'lodash'
import { useStudioStore } from '../store/studio-store'
import { getElementDimensions, setOffset } from './dimensions'
import { getOrCreateHelperDom, getSelectorHighlightStyles, INT32_MAX } from './dom'
import highlightMounter from './selector-playground/highlight-mounter'
import Highlight from './selector-playground/Highlight.ce.vue'

// JQuery bundled w/ Cypress
type $CypressJQuery = any

const sizzleRe = /sizzle/i
const jQueryRe = /jquery/i

export class AutIframe {
  debouncedToggleSelectorPlayground: DebouncedFunc<(isEnabled: any) => void>
  $iframe?: JQuery<HTMLIFrameElement>
  _highlightedEl?: Element
  private _currentHighlightingId: number = 0

  constructor (
    private projectName: string,
    private eventManager: any,
    private $: $CypressJQuery,
  ) {
    this.debouncedToggleSelectorPlayground = _.debounce(this.toggleSelectorPlayground, 300)
  }

  create (): JQuery<HTMLIFrameElement> {
    const $iframe = this.$('<iframe>', {
      id: `Your project: '${this.projectName}'`,
      title: `Your project: '${this.projectName}'`,
      class: 'aut-iframe',
    })

    this.$iframe = $iframe

    return $iframe
  }

  destroy () {
    if (!this.$iframe) {
      throw Error(`Cannot call #remove without first calling #create`)
    }

    this.$iframe.remove()
  }

  _showInitialBlankPage () {
    this._showContents(blankContents.initial())
  }

  _showTestIsolationBlankPage () {
    this._showContents(blankContents.testIsolationBlankPage())
  }

  showVisitFailure = (props) => {
    this._showContents(blankContents.visitFailure(props))
  }

  _showContents (contents) {
    this._body()?.html(contents)
  }

  _contents () {
    return this.$iframe && this.$iframe.contents()
  }

  _window () {
    return this.$iframe?.prop('contentWindow')
  }

  _document () {
    return this.$iframe?.prop('contentDocument')
  }

  _body () {
    return this._contents()?.find('body') as unknown as JQuery<HTMLBodyElement>
  }

  detachDom = () => {
    const Cypress = this.eventManager.getCypress()

    if (!Cypress) return

    return Cypress.cy.detachDom(this._contents())
  }

  /**
   * If the AUT is cross super domain origin relative to top, a security error is thrown and the method returns false
   * If the AUT is cross super domain origin relative to top and chromeWebSecurity is false, origins of the AUT and top need to be compared and returns false
   * Otherwise, if top and the AUT match super domain origins, the method returns true.
   * If the AUT origin is "about://blank", that means the src attribute has been stripped off the iframe and is adhering to same origin policy
   */
  doesAUTMatchTopSuperDomainOrigin = () => {
    const Cypress = this.eventManager.getCypress()

    if (!Cypress) return true

    try {
      const { href: currentHref } = (this.$iframe as any)[0].contentWindow.document.location
      const locationTop = Cypress.Location.create(window.location.href)
      const locationAUT = Cypress.Location.create(currentHref)

      return locationTop.superDomainOrigin === locationAUT.superDomainOrigin || locationAUT.superDomainOrigin === 'about://blank'
    } catch (err) {
      if (err.name === 'SecurityError') {
        return false
      }

      throw err
    }
  }

  /**
   * Removes the src attribute from the AUT iframe, resulting in 'about:blank' being loaded into the iframe
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-src for more details
   */
  removeSrcAttribute = () => {
    this.$iframe?.removeAttr('src')
  }

  visitBlankPage = (testIsolation?: boolean) => {
    return new Promise<void>((resolve) => {
      if (!this.$iframe) {
        resolve()

        return
      }

      this.$iframe.one('load', () => {
        if (testIsolation) {
          this._showTestIsolationBlankPage()
        } else {
          this._showInitialBlankPage()
        }

        resolve()
      })

      this.$iframe[0].src = 'about:blank'
    })
  }

  restoreDom = (snapshot) => {
    if (!this.doesAUTMatchTopSuperDomainOrigin()) {
      /**
       * A load event fires here when the src is removed (as does an unload event).
       * This is equivalent to loading about:blank (see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-src).
       * This doesn't resort in a log message being generated for a new page.
       * In the event-manager code, we stop adding logs from other domains once the spec is finished.
       */
      this.$iframe?.one('load', () => {
        this.restoreDom(snapshot)
      })

      // The iframe is in a cross origin state.
      // Remove the src attribute to adhere to same super domain origin so we can interact with the frame. NOTE: This should only be done ONCE.
      this.removeSrcAttribute()

      return
    }

    const Cypress = this.eventManager.getCypress()
    const { headStyles = undefined, bodyStyles = undefined } = Cypress ? Cypress.cy.getStyles(snapshot) : {}
    const { body, htmlAttrs } = snapshot
    const $contents = this._contents()

    if (!$contents) return

    // Cache DOM queries to avoid redundant _contents() calls
    const $html = $contents.find('html') as any as JQuery<HTMLHtmlElement>
    const $head = $contents.find('head') as any as JQuery<HTMLElement>
    const $body = $contents.find('body') as unknown as JQuery<HTMLBodyElement>

    if ($html) {
      this._replaceHtmlAttrs($html, htmlAttrs)
    }

    // Pass $head to avoid _replaceHeadStyles calling _contents() again
    this._replaceHeadStyles(headStyles, $head)

    // remove the old body and replace with restored one
    $body?.remove()
    this._insertBodyStyles(body.get(), bodyStyles)
    $html?.append(body.get())

    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    this.debouncedToggleSelectorPlayground(selectorPlaygroundStore.isEnabled)
  }

  // note htmlAttrs is actually `NamedNodeMap`: https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap
  // but typing it correctly gives a lot more weird typing errors
  _replaceHtmlAttrs ($html: JQuery<HTMLHtmlElement>, htmlAttrs: Record<string, string>) {
    let oldAttrs = {}

    // remove all attributes
    if ($html[0]) {
      oldAttrs = _.map($html[0].attributes, (attr) => {
        return attr.name
      })
    }

    _.each(oldAttrs, (attr) => {
      $html.removeAttr(attr)
    })

    // set the ones specified
    _.each(htmlAttrs, (value, key) => {
      $html.attr(key, value)
    })
  }

  _replaceHeadStyles (styles: Record<string, any> = {}, $head?: JQuery<HTMLElement>) {
    // Use provided $head if available, otherwise query for it
    if (!$head) {
      $head = this._contents()?.find('head') as any as JQuery<HTMLElement>
    }

    const existingStyles = $head?.find('link[rel="stylesheet"],style')

    _.each(styles, (style, index) => {
      if (style.href) {
        // make a best effort at not disturbing <link> stylesheets
        // if possible by checking to see if the existing head has a
        // stylesheet with the same href in the same position
        this._replaceLink($head, existingStyles?.[index], style)
      } else {
        // for <style> tags, just replace them completely since the contents
        // could be different and it shouldn't cause a FOUC since
        // there's no http request involved
        this._replaceStyle($head, existingStyles?.[index], style)
      }
    })

    // remove any extra stylesheets
    if (existingStyles && existingStyles.length > styles.length) {
      existingStyles.slice(styles.length).remove()
    }
  }

  _replaceLink ($head, existingStyle, style) {
    const linkTag = this._linkTag(style)

    if (!existingStyle) {
      // no existing style at this index, so no more styles at all in
      // the head, so just append it
      $head.append(linkTag)

      return
    }

    if (existingStyle.href !== style.href) {
      this.$(existingStyle).replaceWith(linkTag)
    }
  }

  _replaceStyle ($head, existingStyle, style) {
    const styleTag = this._styleTag(style)

    if (existingStyle) {
      this.$(existingStyle).replaceWith(styleTag)
    } else {
      // no existing style at this index, so no more styles at all in
      // the head, so just append it
      $head.append(styleTag)
    }
  }

  _insertBodyStyles ($body, styles: Record<string, any> = {}) {
    _.each(styles, (style) => {
      $body.append(style.href ? this._linkTag(style) : this._styleTag(style))
    })
  }

  _linkTag (style) {
    return `<link rel="stylesheet" href="${style.href}" />`
  }

  _styleTag (style) {
    return `<style>${style}</style>`
  }

  highlightEl = ({ body }, { $el, coords, highlightAttr, scrollBy }) => {
    // Cancel any ongoing highlighting operation by incrementing the operation ID
    // This ensures any async work from previous calls will see a different ID and stop processing
    this._currentHighlightingId++
    this.removeHighlights()

    // Capture the current operation ID for this highlighting operation
    const highlightingId = this._currentHighlightingId

    if (body) {
      $el = body.get().find(`[${highlightAttr}]`)
    } else {
      body = { get: () => this._body() }
    }

    // normalize
    const el = $el.get(0)
    const $body = body.get()

    body = $body.get(0)

    // scroll the top of the element into view
    if (el) {
      el.scrollIntoView()
      // if we have a scrollBy on our command
      // then we need to additional scroll the window
      // by these offsets
      if (scrollBy) {
        this.$iframe?.prop('contentWindow').scrollBy(scrollBy.x, scrollBy.y)
      }
    }

    // Collect all containers first, then append in a single batch to minimize reflows
    const containers: HTMLElement[] = []
    const elementsToProcess: Array<{ $el: any, dimensions: ReturnType<typeof getElementDimensions> }> = []

    // collect all valid elements and their dimensions
    $el.each((__, element) => {
      const $_el = this.$(element)

      // bail if our el no longer exists in the parent body
      if (!this.$.contains(body, element)) {
        return
      }

      // Get all dimensions and computed styles in one call to avoid multiple getComputedStyle calls
      const dimensions = getElementDimensions($_el.get(0))

      // dont show anything if our element displaces nothing
      // Use offsetWidth/offsetHeight to check because we want to highlight our element even
      // if it only has margin and zero content height / width
      if (dimensions.offsetWidth === 0 || dimensions.offsetHeight === 0 || dimensions.display === 'none') {
        return
      }

      elementsToProcess.push({ $el: $_el, dimensions })
    })

    // create all containers (off-DOM)
    elementsToProcess.forEach(({ $el: $_el, dimensions }) => {
      const container = this._addElementBoxModelLayers($_el, $body, dimensions)

      container.setAttribute('data-highlight-el', `true`)
      containers.push(container)
    })

    // batch append all containers at once to minimize reflows
    if (containers.length > 0) {
      // Use DocumentFragment for even better performance when appending many elements
      const fragment = document.createDocumentFragment()

      containers.forEach((container) => {
        fragment.appendChild(container)
      })

      body.appendChild(fragment)

      // Now that containers are in DOM, set offsets using setOffset (which uses getBoundingClientRect)
      // Batch setOffset calls to avoid layout thrashing - process in chunks using requestAnimationFrame
      const OFFSET_BATCH_SIZE = 100
      let offsetIndex = 0

      const processOffsetBatch = () => {
        // Check if this highlighting operation was cancelled (e.g., user switched to different snapshot)
        // by comparing the captured operation ID with the current one
        if (this._currentHighlightingId !== highlightingId) {
          return
        }

        const endIndex = Math.min(offsetIndex + OFFSET_BATCH_SIZE, containers.length)

        for (let j = offsetIndex; j < endIndex; j++) {
          const container = containers[j]

          // Check if container is still in the DOM (might have been removed by removeHighlights)
          if (!container.isConnected) {
            continue
          }

          for (let i = 0; i < container.children.length; i++) {
            const childEl = container.children[i] as HTMLElement

            // Check if element is still in the DOM before positioning
            if (!childEl.isConnected) {
              continue
            }

            const top = parseFloat(childEl.getAttribute('data-top')!)
            const left = parseFloat(childEl.getAttribute('data-left')!)

            setOffset(childEl, { top, left })
          }
        }

        offsetIndex = endIndex

        if (offsetIndex < containers.length) {
          // Process next batch on next frame to avoid blocking
          requestAnimationFrame(processOffsetBatch)
        } else {
          // All highlights have been positioned
        }
      }

      // Start processing offsets in batches
      processOffsetBatch()
    }

    if (coords) {
      requestAnimationFrame(() => {
        // Check if this highlighting operation was cancelled before adding hitbox
        if (this._currentHighlightingId !== highlightingId) {
          return
        }

        const bodyElement = $body.get(0)

        if (!bodyElement) {
          return
        }

        this._addHitBoxLayer(coords, bodyElement).setAttribute('data-highlight-hitbox', 'true')
      })
    }
  }

  removeHighlights = () => {
    const $contents = this._contents()

    if (!$contents) return

    const contentsElement = $contents[0] as Document | Element

    if (!contentsElement || typeof contentsElement.querySelectorAll !== 'function') {
      return
    }

    const highlights = contentsElement.querySelectorAll('.__cypress-highlight')

    // Batch remove using native DOM API
    highlights.forEach((el) => el.remove())
  }

  toggleSelectorPlayground = (isEnabled) => {
    const $body = this._body()

    if (!$body) return

    if (isEnabled) {
      $body.on('mouseenter', this._resetShowHighlight)
      $body.on('mousemove', this._onSelectorMouseMove)
      $body.on('mouseleave', this._clearHighlight)
    } else {
      $body.off('mouseenter', this._resetShowHighlight)
      $body.off('mousemove', this._onSelectorMouseMove)
      $body.off('mouseleave', this._clearHighlight)
      if (this._highlightedEl) {
        this._clearHighlight()
      }
    }
  }

  _resetShowHighlight = () => {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    selectorPlaygroundStore.setShowingHighlight(false)
  }

  _onSelectorMouseMove = (e: JQuery.MouseMoveEvent) => {
    const $body = this._body()

    if (!$body) return

    let el = e.target
    let $el = this.$(el)

    const $ancestorHighlight = $el.closest('.__cypress-selector-playground')

    if ($ancestorHighlight.length) {
      $el = $ancestorHighlight
    }

    if ($ancestorHighlight.length || $el.hasClass('__cypress-selector-playground')) {
      const $highlight = $el

      $highlight.css('display', 'none')
      el = this._document().elementFromPoint(e.clientX, e.clientY)
      $el = this.$(el)
      $highlight.css('display', 'block')
    }

    if (this._highlightedEl === el) return

    this._highlightedEl = el

    const Cypress = this.eventManager.getCypress()

    const selector = Cypress.ElementSelector._getSelector($el)
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    this._addOrUpdateSelectorPlaygroundHighlight({
      $el,
      $body,
      selector,
      showTooltip: true,
      onClick: () => {
        selectorPlaygroundStore.setNumElements(1)
        selectorPlaygroundStore.resetMethod()
        selectorPlaygroundStore.setSelector(selector)
        selectorPlaygroundStore.setValidity(!!el)
      },
    })
  }

  _clearHighlight = () => {
    const $body = this._body()

    if (!$body) return

    this._addOrUpdateSelectorPlaygroundHighlight({
      $el: null,
      $body,
    })

    if (this._highlightedEl) {
      this._highlightedEl = undefined
    }
  }

  toggleSelectorHighlight (isShowingHighlight: boolean) {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    if (!isShowingHighlight) {
      this._clearHighlight()

      return
    }

    const Cypress = this.eventManager.getCypress()

    const $el = this.getElements(Cypress.dom)

    selectorPlaygroundStore.setValidity(!!$el)

    if ($el) {
      selectorPlaygroundStore.setNumElements($el.length)

      if ($el.length) {
        this._scrollIntoView(this._window(), $el[0])
      }
    }

    this._addOrUpdateSelectorPlaygroundHighlight({
      $el: $el && $el.length ? $el : null,
      $body: this._body(),
      selector: selectorPlaygroundStore.selector,
      showTooltip: false,
    })
  }

  getElements (cypressDom) {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()
    const $contents = this._contents()

    if (!$contents || !selectorPlaygroundStore.selector) return

    return this._getElementsForSelector({
      method: selectorPlaygroundStore.method,
      selector: selectorPlaygroundStore.selector,
      cypressDom,
      $root: $contents,
    })
  }

  printSelectorElementsToConsole () {
    logger.clearLog()

    const Cypress = this.eventManager.getCypress()

    const $el = this.getElements(Cypress.dom)

    const selectorPlaygroundStore = useSelectorPlaygroundStore()

    if (!$el) {
      return logger.logFormatted({
        name: selectorPlaygroundStore.command,
        type: 'command',
        props: {
          Yielded: 'Nothing',
        },
      })
    }

    logger.logFormatted({
      name: selectorPlaygroundStore.command,
      type: 'command',
      props: {
        Elements: $el.length,
        Yielded: Cypress.dom.getElements($el),
      },
    })
  }

  startStudio () {
    const studioStore = useStudioStore()

    studioStore.start()
  }

  private _scrollIntoView (win: Window, el: HTMLElement) {
    if (!el || this._isInViewport(win, el)) return

    el.scrollIntoView()
  }

  private _isInViewport = (win: Window, el: HTMLElement) => {
    let rect = el.getBoundingClientRect()

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= win.innerHeight &&
      rect.right <= win.innerWidth
    )
  }

  private _getElementsForSelector ({ $root, selector, method, cypressDom }) {
    let $el: JQuery<HTMLElement> | null = null

    try {
      if (method === 'contains') {
        $el = $root.find(cypressDom.getContainsSelector(selector)) as JQuery<HTMLElement>
        if ($el.length) {
          $el = cypressDom.getFirstDeepestElement($el)
        }
      } else {
        $el = $root.find(selector)
      }
    } catch (err) {
      // if not a sizzle or jQuery error, ignore it and let $el be null
      if (!(sizzleRe.test(err.stack) || jQueryRe.test(err.stack))) throw err
    }

    return $el
  }

  private _addHitBoxLayer (coords: { x: number, y: number }, body: HTMLBodyElement) {
    const height = 10
    const width = 10

    const dotHeight = 4
    const dotWidth = 4

    const top = coords.y - height / 2
    const left = coords.x - width / 2

    const dotTop = height / 2 - dotHeight / 2
    const dotLeft = width / 2 - dotWidth / 2

    const resetStyles: Partial<CSSStyleDeclaration> = {
      border: 'none !important',
      margin: '0 !important',
      padding: '0 !important',
    }

    // Create box

    const boxStyles: Partial<CSSStyleDeclaration> = {
      ...resetStyles,
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: 'red',
      borderRadius: '5px',
      boxShadow: '0 0 5px #333',
      zIndex: '2147483647',
    }

    const box = document.createElement('div')

    box.classList.add('__cypress-highlight')

    for (const key in boxStyles) {
      box.style[key!] = boxStyles[key]
    }

    // Create wrapper

    const wrapperStyles: Partial<CSSStyleDeclaration> = {
      ...resetStyles,
      position: 'relative',
    }

    const wrapper = document.createElement('div')

    for (const key in wrapperStyles) {
      wrapper.style[key!] = wrapperStyles[key]
    }

    // Create dot

    const dotStyles: Partial<CSSStyleDeclaration> = {
      ...resetStyles,
      position: 'absolute',
      top: `${dotTop}px`,
      left: `${dotLeft}px`,
      height: `${dotHeight}px`,
      width: `${dotWidth}px`,
      backgroundColor: 'pink',
      borderRadius: '5px',
    }

    const dot = document.createElement('div')

    for (const key in dotStyles) {
      dot.style[key!] = dotStyles[key]
    }

    body.appendChild(box)
    box.appendChild(wrapper)
    wrapper.appendChild(dot)

    return box
  }

  private _addElementBoxModelLayers ($el, $body, dimensions?: ReturnType<typeof getElementDimensions>) {
    $body = $body || this.$('body')

    const el = $el.get(0)

    // Use existing dimensions if provided to avoid redundant getComputedStyle calls
    const elementDimensions: ReturnType<typeof getElementDimensions> = dimensions || getElementDimensions(el)

    // Ensure transform and zIndex are valid (should always be set by getElementDimensions)
    const transform = elementDimensions.transform || 'none'
    const zIndex = elementDimensions.zIndex ?? 2147483647

    const container = document.createElement('div')

    container.classList.add('__cypress-highlight')

    container.style.opacity = '0.7'
    container.style.position = 'absolute'
    container.style.zIndex = INT32_MAX.toString()

    const layers = {
      Content: '#9FC4E7',
      Padding: '#C1CD89',
      Border: '#FCDB9A',
      Margin: '#F9CC9D',
    }

    // create the margin / bottom / padding layers
    _.each(layers, (color, attr) => {
      let obj

      switch (attr) {
        case 'Content':
          // rearrange the contents offset so
          // its inside of our border + padding
          obj = {
            width: elementDimensions.width,
            height: elementDimensions.height,
            top: elementDimensions.offset.top + elementDimensions.borderTop + elementDimensions.paddingTop,
            left: elementDimensions.offset.left + elementDimensions.borderLeft + elementDimensions.paddingLeft,
          }

          break
        default:
          obj = {
            width: this._getDimensionsFor(elementDimensions, attr, 'width'),
            height: this._getDimensionsFor(elementDimensions, attr, 'height'),
            top: elementDimensions.offset.top,
            left: elementDimensions.offset.left,
          }
      }

      // if attr is margin then we need to additional
      // subtract what the actual marginTop + marginLeft
      // values are, since offset disregards margin completely
      if (attr === 'Margin') {
        obj.top -= elementDimensions.marginTop
        obj.left -= elementDimensions.marginLeft
      }

      if (attr === 'Padding') {
        obj.top += elementDimensions.borderTop
        obj.left += elementDimensions.borderLeft
      }

      // bail if the dimensions of this layer match the previous one
      // so we dont create unnecessary layers
      if (this._dimensionsMatchPreviousLayer(obj, container)) {
        return
      }

      this._createLayer(attr, color, container, obj, transform, zIndex)
    })

    // Note: setOffset will be called after container is appended to DOM
    // The offsets are stored in data-top/data-left attributes for now
    return container
  }

  private _createLayer (attr, color, container, dimensions, transform: string, zIndex: number) {
    const div = document.createElement('div')

    // Set transform directly (original code always set it, even if 'none')
    div.style.transform = transform

    div.style.width = `${dimensions.width}px`
    div.style.height = `${dimensions.height}px`
    div.style.position = 'absolute'
    div.style.zIndex = `${zIndex}`
    div.style.backgroundColor = color

    div.setAttribute('data-top', dimensions.top.toString())
    div.setAttribute('data-left', dimensions.left.toString())
    div.setAttribute('data-layer', attr)

    container.prepend(div)

    return div
  }

  private _dimensionsMatchPreviousLayer (obj, container) {
    // since we're prepending to the container that
    // means the previous layer is actually the first child element
    const previousLayer = container.childNodes[0]

    // bail if there is no previous layer
    if (!previousLayer) {
      return
    }

    return obj.width === previousLayer.offsetWidth &&
      obj.height === previousLayer.offsetHeight
  }

  private _getDimensionsFor (dimensions, attr, dimension) {
    return dimensions[`${dimension}With${attr}`]
  }

  private listeners: any[] = []

  private _addOrUpdateSelectorPlaygroundHighlight ({ $el, $body, selector, showTooltip, onClick }: any) {
    const { container, vueContainer } = getOrCreateHelperDom({
      body: $body?.get(0) || document.body,
      className: '__cypress-selector-playground',
      css: Highlight.styles[0],
    })

    const removeContainerClickListeners = () => {
      this.listeners.forEach((listener) => {
        vueContainer.removeEventListener('click', listener)
      })

      this.listeners = []
    }

    if (!$el) {
      removeContainerClickListeners()
      container.remove()

      return
    }

    const elements = $el.get()
    const styles = getSelectorHighlightStyles(elements)

    if (elements.length === 1) {
      removeContainerClickListeners()

      if (onClick) {
        vueContainer.addEventListener('click', onClick)
        this.listeners.push(onClick)
      }
    }

    highlightMounter.mount(vueContainer, selector, styles)
  }
}
