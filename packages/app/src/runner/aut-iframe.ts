import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import { blankContents } from '../components/Blank'
import { logger } from './logger'
import _ from 'lodash'
/* eslint-disable no-duplicate-imports */
import type { DebouncedFunc } from 'lodash'
import { useStudioStore } from '../store/studio-store'
import { getElementDimensions, setOffset } from './dimensions'
import { getOrCreateHelperDom, getSelectorHighlightStyles, getZIndex, INT32_MAX } from './dom'
import highlightMounter from './selector-playground/highlight-mounter'
import Highlight from './selector-playground/Highlight.ce.vue'

// JQuery bundled w/ Cypress
type $CypressJQuery = any

const sizzleRe = /sizzle/i

export class AutIframe {
  debouncedToggleSelectorPlayground: DebouncedFunc<(isEnabled: any) => void>
  $iframe?: JQuery<HTMLIFrameElement>
  _highlightedEl?: Element

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
    this.$iframe?.removeAttr('srcdoc')
  }

  visitBlankPage = (testIsolation?: boolean) => {
    return new Promise<void>((resolve) => {
      if (!this.$iframe) {
        return
      }

      this.$iframe[0].srcdoc = '<!DOCTYPE html><html><head></head><body></body></html>'

      this.$iframe.one('load', () => {
        if (testIsolation) {
          this._showTestIsolationBlankPage()
        } else {
          this._showInitialBlankPage()
        }

        resolve()
      })
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
    const contents = this._contents()
    const $html = contents?.find('html') as any as JQuery<HTMLHtmlElement>

    if ($html) {
      this._replaceHtmlAttrs($html, htmlAttrs)
    }

    this._replaceHeadStyles(headStyles)

    // remove the old body and replace with restored one

    this._body()?.remove()
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

  _replaceHeadStyles (styles: Record<string, any> = {}) {
    const $head = this._contents()?.find('head')
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
    this.removeHighlights()

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

    $el.each((__, element) => {
      const $_el = this.$(element)

      // bail if our el no longer exists in the parent body
      if (!this.$.contains(body, element)) return

      // switch to using offsetWidth + offsetHeight
      // because we want to highlight our element even
      // if it only has margin and zero content height / width
      const dimensions = this._getOffsetSize($_el.get(0))

      // dont show anything if our element displaces nothing
      if (dimensions.width === 0 || dimensions.height === 0 || $_el.css('display') === 'none') {
        return
      }

      this._addElementBoxModelLayers($_el, $body).setAttribute('data-highlight-el', `true`)
    })

    if (coords) {
      requestAnimationFrame(() => {
        this._addHitBoxLayer(coords, $body.get(0)).setAttribute('data-highlight-hitbox', 'true')
      })
    }
  }

  removeHighlights = () => {
    this._contents() && this._contents()?.find('.__cypress-highlight').remove()
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

    const selector = Cypress.SelectorPlayground.getSelector($el)
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

    if (studioStore.isLoading) {
      studioStore.start(this._body()?.[0])
    }
  }

  reattachStudio () {
    const studioStore = useStudioStore()

    if (studioStore.isActive) {
      const body = this._body()?.[0]

      if (!body) {
        throw Error(`Cannot reattach Studio without the HTMLBodyElement for the app`)
      }

      studioStore.attachListeners(body)
    }
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
      // if not a sizzle error, ignore it and let $el be null
      if (!sizzleRe.test(err.stack)) throw err
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

  private _getOffsetSize (el: HTMLElement) {
    return {
      width: el.offsetWidth,
      height: el.offsetHeight,
    }
  }

  private _addElementBoxModelLayers ($el, $body) {
    $body = $body || $('body')

    const el = $el.get(0)
    const body = $body.get(0)

    const dimensions = getElementDimensions(el)

    const container = document.createElement('div')

    container.classList.add('__cypress-highlight')

    container.style.opacity = `0.7`
    container.style.position = 'absolute'
    container.style.zIndex = `${INT32_MAX}`

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
            width: dimensions.width,
            height: dimensions.height,
            top: dimensions.offset.top + dimensions.borderTop + dimensions.paddingTop,
            left: dimensions.offset.left + dimensions.borderLeft + dimensions.paddingLeft,
          }

          break
        default:
          obj = {
            width: this._getDimensionsFor(dimensions, attr, 'width'),
            height: this._getDimensionsFor(dimensions, attr, 'height'),
            top: dimensions.offset.top,
            left: dimensions.offset.left,
          }
      }

      // if attr is margin then we need to additional
      // subtract what the actual marginTop + marginLeft
      // values are, since offset disregards margin completely
      if (attr === 'Margin') {
        obj.top -= dimensions.marginTop
        obj.left -= dimensions.marginLeft
      }

      if (attr === 'Padding') {
        obj.top += dimensions.borderTop
        obj.left += dimensions.borderLeft
      }

      // bail if the dimensions of this layer match the previous one
      // so we dont create unnecessary layers
      if (this._dimensionsMatchPreviousLayer(obj, container)) return

      this._createLayer($el.get(0), attr, color, container, obj)
    })

    body.appendChild(container)

    for (let i = 0; i < container.children.length; i++) {
      const el = container.children[i] as HTMLElement
      const top = parseFloat(el.getAttribute('data-top')!)
      const left = parseFloat(el.getAttribute('data-left')!)

      setOffset(el, { top, left })
    }

    return container
  }

  private _createLayer (el, attr, color, container, dimensions) {
    const div = document.createElement('div')

    div.style.transform = getComputedStyle(el, null).transform
    div.style.width = `${dimensions.width}px`
    div.style.height = `${dimensions.height}px`
    div.style.position = 'absolute'
    div.style.zIndex = `${getZIndex(el)}`
    div.style.backgroundColor = color

    div.setAttribute('data-top', dimensions.top)
    div.setAttribute('data-left', dimensions.left)
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
