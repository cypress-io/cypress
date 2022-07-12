import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import { blankContents } from '../components/Blank'
import { logger } from './logger'
import _ from 'lodash'
/* eslint-disable no-duplicate-imports */
import type { DebouncedFunc } from 'lodash'

// JQuery bundled w/ Cypress
type $CypressJQuery = any

export class AutIframe {
  debouncedToggleSelectorPlayground: DebouncedFunc<(isEnabled: any) => void>
  $iframe?: JQuery<HTMLIFrameElement>
  _highlightedEl?: Element

  constructor (
    private projectName: string,
    private eventManager: any,
    private $: $CypressJQuery,
    private dom: any,
    private studioRecorder: any,
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

  showInitialBlankContentsE2E () {
    this._showContents(blankContents.initial())
  }

  showInitialBlankContentsCT () {
    this._showContents(blankContents.initialCT())
  }

  showSessionBlankContents () {
    this._showContents(blankContents.session())
  }

  showSessionLifecycleBlankContents () {
    this._showContents(blankContents.sessionLifecycle())
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
    return this._contents()?.find('body')
  }

  detachDom = () => {
    const Cypress = this.eventManager.getCypress()

    if (!Cypress) return

    return Cypress.cy.detachDom(this._contents())
  }

  /**
   * If the AUT is cross origin relative to top, a security error is thrown and the method returns false
   * If the AUT is cross origin relative to top and chromeWebSecurity is false, origins of the AUT and top need to be compared and returns false
   * Otherwise, if top and the AUT match origins, the method returns true.
   * If the AUT origin is "about://blank", that means the src attribute has been stripped off the iframe and is adhering to same origin policy
   */
  doesAUTMatchTopOriginPolicy = () => {
    const Cypress = this.eventManager.getCypress()

    if (!Cypress) return true

    try {
      const { href: currentHref } = (this.$iframe as any)[0].contentWindow.document.location
      const locationTop = Cypress.Location.create(window.location.href)
      const locationAUT = Cypress.Location.create(currentHref)

      return locationTop.originPolicy === locationAUT.originPolicy || locationAUT.originPolicy === 'about://blank'
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

  visitBlank = ({ type }: { type?: 'session' | 'session-lifecycle' }) => {
    return new Promise<void>((resolve) => {
      if (!this.$iframe) {
        return
      }

      this.$iframe[0].src = 'about:blank'

      this.$iframe.one('load', () => {
        switch (type) {
          case 'session':
            this.showSessionBlankContents()
            break
          case 'session-lifecycle':
            this.showSessionLifecycleBlankContents()
            break
          default:
            this.showInitialBlankContentsE2E()
        }

        resolve()
      })
    })
  }

  restoreDom = (snapshot) => {
    if (!this.doesAUTMatchTopOriginPolicy()) {
      /**
       * A load event fires here when the src is removed (as does an unload event).
       * This is equivalent to loading about:blank (see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-src).
       * This doesn't resort in a log message being generated for a new page.
       * In the event-manager code, we stop adding logs from other domains once the spec is finished.
       */
      this.$iframe?.one('load', () => {
        this.restoreDom(snapshot)
      })

      // The iframe is in a cross origin state. Remove the src attribute to adhere to same origin policy. NOTE: This should only be done ONCE.
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

      // switch to using outerWidth + outerHeight
      // because we want to highlight our element even
      // if it only has margin and zero content height / width
      const dimensions = this.dom.getOuterSize($_el)

      // dont show anything if our element displaces nothing
      if (dimensions.width === 0 || dimensions.height === 0 || $_el.css('display') === 'none') {
        return
      }

      this.dom.addElementBoxModelLayers($_el, $body).attr('data-highlight-el', true)
    })

    if (coords) {
      requestAnimationFrame(() => {
        this.dom.addHitBoxLayer(coords, $body).attr('data-highlight-hitbox', true)
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

    this.dom.addOrUpdateSelectorPlaygroundHighlight({
      $el,
      selector,
      $body,
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

    this.dom.addOrUpdateSelectorPlaygroundHighlight({ $el: null, $body })
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
        this.dom.scrollIntoView(this._window(), $el[0])
      }
    }

    this.dom.addOrUpdateSelectorPlaygroundHighlight({
      $el: $el && $el.length ? $el : null,
      selector: selectorPlaygroundStore.selector,
      $body: this._body(),
      showTooltip: false,
    })
  }

  getElements (cypressDom) {
    const selectorPlaygroundStore = useSelectorPlaygroundStore()
    const $contents = this._contents()

    if (!$contents || !selectorPlaygroundStore.selector) return

    return this.dom.getElementsForSelector({
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
        Command: selectorPlaygroundStore.command,
        Yielded: 'Nothing',
      })
    }

    logger.logFormatted({
      Command: selectorPlaygroundStore.command,
      Elements: $el.length,
      Yielded: Cypress.dom.getElements($el),
    })
  }

  startStudio = () => {
    if (this.studioRecorder.isLoading) {
      this.studioRecorder.start(this._body()?.[0])
    }
  }

  reattachStudio = () => {
    if (this.studioRecorder.isActive) {
      this.studioRecorder.attachListeners(this._body()?.[0])
    }
  }
}
