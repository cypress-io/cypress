import _ from 'lodash'
import { $ } from '@packages/driver'

import dom from '../lib/dom'
import logger from '../lib/logger'
import eventManager from '../lib/event-manager'
import visitFailure from './visit-failure'
import blankContents from './blank-contents'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'

export default class AutIframe {
  constructor (config) {
    this.config = config
    this.debouncedToggleSelectorPlayground = _.debounce(this.toggleSelectorPlayground, 300)
  }

  create () {
    this.$iframe = $('<iframe>', {
      id: `Your App: '${this.config.projectName}'`,
      class: 'aut-iframe',
    })

    return this.$iframe
  }

  showBlankContents () {
    this._showContents(blankContents())
  }

  showVisitFailure = (props) => {
    this._showContents(visitFailure(props))
  }

  _showContents (contents) {
    this._body().html(contents)
  }

  _contents () {
    return this.$iframe && this.$iframe.contents()
  }

  _window () {
    return this.$iframe.prop('contentWindow')
  }

  _document () {
    return this.$iframe.prop('contentDocument')
  }

  _body () {
    return this._contents() && this._contents().find('body')
  }

  detachDom = () => {
    const Cypress = eventManager.getCypress()

    if (!Cypress) return

    return Cypress.cy.detachDom(this._contents())
  }

  restoreDom = (snapshot) => {
    const Cypress = eventManager.getCypress()
    const { headStyles, bodyStyles } = Cypress ? Cypress.cy.getStyles(snapshot) : {}
    const { body, htmlAttrs } = snapshot
    const contents = this._contents()
    const $html = contents.find('html')

    this._replaceHtmlAttrs($html, htmlAttrs)
    this._replaceHeadStyles(headStyles)

    // remove the old body and replace with restored one
    this._body().remove()
    this._insertBodyStyles(body.get(), bodyStyles)
    $html.append(body.get())

    this.debouncedToggleSelectorPlayground(selectorPlaygroundModel.isEnabled)
  }

  _replaceHtmlAttrs ($html, htmlAttrs) {
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

  _replaceHeadStyles (styles = []) {
    const $head = this._contents().find('head')
    const existingStyles = $head.find('link[rel="stylesheet"],style')

    _.each(styles, (style, index) => {
      if (style.href) {
        // make a best effort at not disturbing <link> stylesheets
        // if possible by checking to see if the existing head has a
        // stylesheet with the same href in the same position
        this._replaceLink($head, existingStyles[index], style)
      } else {
        // for <style> tags, just replace them completely since the contents
        // could be different and it shouldn't cause a FOUC since
        // there's no http request involved
        this._replaceStyle($head, existingStyles[index], style)
      }
    })

    // remove any extra stylesheets
    if (existingStyles.length > styles.length) {
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
      $(existingStyle).replaceWith(linkTag)
    }
  }

  _replaceStyle ($head, existingStyle, style) {
    const styleTag = this._styleTag(style)

    if (existingStyle) {
      $(existingStyle).replaceWith(styleTag)
    } else {
      // no existing style at this index, so no more styles at all in
      // the head, so just append it
      $head.append(styleTag)
    }
  }

  _insertBodyStyles ($body, styles = []) {
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
        this.$iframe.prop('contentWindow').scrollBy(scrollBy.x, scrollBy.y)
      }
    }

    $el.each((__, element) => {
      const $_el = $(element)

      // bail if our el no longer exists in the parent body
      if (!$.contains(body, element)) return

      // switch to using outerWidth + outerHeight
      // because we want to highlight our element even
      // if it only has margin and zero content height / width
      const dimensions = dom.getOuterSize($_el)

      // dont show anything if our element displaces nothing
      if (dimensions.width === 0 || dimensions.height === 0 || $_el.css('display') === 'none') {
        return
      }

      dom.addElementBoxModelLayers($_el, $body).attr('data-highlight-el', true)
    })

    if (coords) {
      requestAnimationFrame(() => {
        dom.addHitBoxLayer(coords, $body).attr('data-highlight-hitbox', true)
      })
    }
  }

  removeHighlights = () => {
    this._contents() && this._contents().find('.__cypress-highlight').remove()
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
    selectorPlaygroundModel.setShowingHighlight(false)
  }

  _onSelectorMouseMove = (e) => {
    const $body = this._body()

    if (!$body) return

    let el = e.target
    let $el = $(el)

    const $ancestorHighlight = $el.closest('.__cypress-selector-playground')

    if ($ancestorHighlight.length) {
      $el = $ancestorHighlight
    }

    if ($ancestorHighlight.length || $el.hasClass('__cypress-selector-playground')) {
      const $highlight = $el

      $highlight.css('display', 'none')
      el = this._document().elementFromPoint(e.clientX, e.clientY)
      $el = $(el)
      $highlight.css('display', 'block')
    }

    if (this._highlightedEl === el) return

    this._highlightedEl = el

    const Cypress = eventManager.getCypress()

    const selector = Cypress.SelectorPlayground.getSelector($el)

    dom.addOrUpdateSelectorPlaygroundHighlight({
      $el,
      selector,
      $body,
      showTooltip: true,
      onClick: () => {
        selectorPlaygroundModel.setNumElements(1)
        selectorPlaygroundModel.resetMethod()
        selectorPlaygroundModel.setSelector(selector)
      },
    })
  }

  _clearHighlight = () => {
    const $body = this._body()

    if (!$body) return

    dom.addOrUpdateSelectorPlaygroundHighlight({ $el: null, $body })
    if (this._highlightedEl) {
      this._highlightedEl = null
    }
  }

  toggleSelectorHighlight (isShowingHighlight) {
    if (!isShowingHighlight) {
      this._clearHighlight()

      return
    }

    const Cypress = eventManager.getCypress()

    const $el = this.getElements(Cypress.dom)

    selectorPlaygroundModel.setValidity(!!$el)

    if ($el) {
      selectorPlaygroundModel.setNumElements($el.length)

      if ($el.length) {
        dom.scrollIntoView(this._window(), $el[0])
      }
    }

    dom.addOrUpdateSelectorPlaygroundHighlight({
      $el: $el && $el.length ? $el : null,
      selector: selectorPlaygroundModel.selector,
      $body: this._body(),
      showTooltip: false,
    })
  }

  getElements (cypressDom) {
    const { selector, method } = selectorPlaygroundModel
    const $contents = this._contents()

    if (!$contents || !selector) return

    return dom.getElementsForSelector({
      method,
      selector,
      cypressDom,
      $root: $contents,
    })
  }

  printSelectorElementsToConsole () {
    logger.clearLog()

    const Cypress = eventManager.getCypress()

    const $el = this.getElements(Cypress.dom)

    const command = `cy.${selectorPlaygroundModel.method}('${selectorPlaygroundModel.selector}')`

    if (!$el) {
      return logger.logFormatted({
        Command: command,
        Yielded: 'Nothing',
      })
    }

    logger.logFormatted({
      Command: command,
      Elements: $el.length,
      Yielded: Cypress.dom.getElements($el),
    })
  }

  beforeScreenshot = (config) => {
    // could fail if iframe is cross-origin, so fail gracefully
    try {
      if (config.disableTimersAndAnimations) {
        dom.addCssAnimationDisabler(this._body())
      }

      _.each(config.blackout, (selector) => {
        dom.addBlackout(this._body(), selector)
      })
    } catch (err) {
      /* eslint-disable no-console */
      console.error('Failed to modify app dom:')
      console.error(err)
      /* eslint-disable no-console */
    }
  }

  afterScreenshot = (config) => {
    // could fail if iframe is cross-origin, so fail gracefully
    try {
      if (config.disableTimersAndAnimations) {
        dom.removeCssAnimationDisabler(this._body())
      }

      dom.removeBlackouts(this._body())
    } catch (err) {
      /* eslint-disable no-console */
      console.error('Failed to modify app dom:')
      console.error(err)
      /* eslint-disable no-console */
    }
  }
}
