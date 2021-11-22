import type { DebouncedFunc } from 'lodash'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'
import type JQuery from 'jquery'

// JQuery bundled w/ Cypress
type $CypressJQuery = any

export class AutIframe {
  debouncedToggleSelectorPlayground: DebouncedFunc<(isEnabled: any) => void>
  $iframe?: JQuery<HTMLIFrameElement>
  logger: any
  _highlightedEl?: Element

  constructor (
    private projectName: string,
    private eventManager: any,
    private _: any,
    private $: $CypressJQuery,
    logger: any,
    private dom: any,
    private visitFailure: (props: any) => string,
    private studioRecorder: any,
    private blankContents: {
      initial: () => string
      session: () => string
      sessionLifecycle: () => string
    },
  ) {
    this.logger = logger
    this.debouncedToggleSelectorPlayground = this._.debounce(this.toggleSelectorPlayground, 300)
  }

  create (): JQuery<HTMLIFrameElement> {
    const $iframe = this.$('<iframe>', {
      id: `Your App: '${this.projectName}'`,
      class: 'aut-iframe',
    })

    this.$iframe = $iframe

    return $iframe
  }

  showInitialBlankContents () {
    this._showContents(this.blankContents.initial())
  }

  showSessionBlankContents () {
    this._showContents(this.blankContents.session())
  }

  showSessionLifecycleBlankContents () {
    this._showContents(this.blankContents.sessionLifecycle())
  }

  showVisitFailure = (props) => {
    this._showContents(this.visitFailure(props))
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
            this.showInitialBlankContents()
        }

        resolve()
      })
    })
  }

  restoreDom = (snapshot) => {
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
      oldAttrs = this._.map($html[0].attributes, (attr) => {
        return attr.name
      })
    }

    this._.each(oldAttrs, (attr) => {
      $html.removeAttr(attr)
    })

    // set the ones specified
    this._.each(htmlAttrs, (value, key) => {
      $html.attr(key, value)
    })
  }

  _replaceHeadStyles (styles: Record<string, any> = {}) {
    const $head = this._contents()?.find('head')
    const existingStyles = $head?.find('link[rel="stylesheet"],style')

    this._.each(styles, (style, index) => {
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
    this._.each(styles, (style) => {
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
    this.logger.clearLog()

    const Cypress = this.eventManager.getCypress()

    const $el = this.getElements(Cypress.dom)

    const selectorPlaygroundStore = useSelectorPlaygroundStore()
    const command = `cy.${selectorPlaygroundStore.method}('${selectorPlaygroundStore.selector}')`

    if (!$el) {
      return this.logger.logFormatted({
        Command: command,
        Yielded: 'Nothing',
      })
    }

    this.logger.logFormatted({
      Command: command,
      Elements: $el.length,
      Yielded: Cypress.dom.getElements($el),
    })
  }

  beforeScreenshot = (config) => {
    // could fail if iframe is cross-origin, so fail gracefully
    try {
      if (config.disableTimersAndAnimations) {
        this.dom.addCssAnimationDisabler(this._body())
      }

      this._.each(config.blackout, (selector) => {
        this.dom.addBlackout(this._body(), selector)
      })
    } catch (err) {
      /* eslint-disable no-console */
      console.error('Failed to modify app this.dom:')
      console.error(err)
      /* eslint-disable no-console */
    }
  }

  afterScreenshot = (config) => {
    // could fail if iframe is cross-origin, so fail gracefully
    try {
      if (config.disableTimersAndAnimations) {
        this.dom.removeCssAnimationDisabler(this._body())
      }

      this.dom.removeBlackouts(this._body())
    } catch (err) {
      /* eslint-disable no-console */
      console.error('Failed to modify app this.dom:')
      console.error(err)
      /* eslint-disable no-console */
    }
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
