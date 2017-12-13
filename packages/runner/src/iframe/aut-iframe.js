import _ from 'lodash'
import { $ } from '@packages/driver'

import blankContents from './blank-contents'
import dom from '../lib/dom'
import eventManager from '../lib/event-manager'
import visitFailure from './visit-failure'
import selectorHelperModel from '../selector-helper/selector-helper-model'

const sizzleRe = /sizzle/i

export default class AutIframe {
  constructor (config) {
    this.config = config
    this.debouncedToggleSelectorHelper = _.debounce(this.toggleSelectorHelper, 300)
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

  detachDom = (Cypress) => {
    const contents = this._contents()
    const { headStyles, bodyStyles } = Cypress.getStyles()
    const htmlAttrs = _.transform(contents.find('html')[0].attributes, (memo, attr) => {
      if (attr.specified) {
        memo[attr.name] = attr.value
      }
    }, {})
    const $body = contents.find('body')
    $body.find('script,link[rel="stylesheet"],style').remove()
    return {
      body: $body.detach(),
      htmlAttrs,
      headStyles,
      bodyStyles,
    }
  }

  restoreDom = ({ body, htmlAttrs, headStyles, bodyStyles }) => {
    const contents = this._contents()

    const $html = contents.find('html')
    this._replaceHtmlAttrs($html, htmlAttrs)

    this._replaceHeadStyles(headStyles)

    // remove the old body and replace with restored one
    this._body().remove()
    this._insertBodyStyles(body, bodyStyles)
    $html.append(body)

    this.debouncedToggleSelectorHelper(selectorHelperModel.isEnabled)
  }

  _replaceHtmlAttrs ($html, htmlAttrs) {
    // remove all attributes
    const oldAttrs = _.map($html[0].attributes, (attr) => attr.name)
    _.each(oldAttrs, (attr) => {
      $html.removeAttr(attr)
    })

    // set the ones specified
    _.each(htmlAttrs, (value, key) => {
      $html.attr(key, value)
    })
  }

  _replaceHeadStyles (styles) {
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

  _insertBodyStyles ($body, styles) {
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
      $el = body.find(`[${highlightAttr}]`)
    } else {
      body = this._body()
    }

    // scroll the top of the element into view
    if ($el.get(0)) {
      $el.get(0).scrollIntoView()
      // if we have a scrollBy on our command
      // then we need to additional scroll the window
      // by these offsets
      if (scrollBy) {
        this.$iframe.prop('contentWindow').scrollBy(scrollBy.x, scrollBy.y)
      }
    }

    $el.each((__, el) => {
      el = $(el)
      // bail if our el no longer exists in the parent body
      if (!$.contains(body[0], el[0])) return

      // switch to using outerWidth + outerHeight
      // because we want to highlight our element even
      // if it only has margin and zero content height / width
      const dimensions = dom.getOuterSize(el)
      // dont show anything if our element displaces nothing
      if (dimensions.width === 0 || dimensions.height === 0 || el.css('display') === 'none') return

      dom.addElementBoxModelLayers(el, body).attr('data-highlight-el', true)
    })

    if (coords) {
      requestAnimationFrame(() => {
        dom.addHitBoxLayer(coords, body).attr('data-highlight-hitbox', true)
      })
    }
  }

  removeHighlights = () => {
    this._contents() && this._contents().find('.__cypress-highlight').remove()
  }

  toggleSelectorHelper = (isEnabled) => {
    const $body = this._body()
    if (!$body) return

    const clearHighlight = this._clearHighlight.bind(this, false)

    if (isEnabled) {
      $body.on('mousemove', this._onSelectorMouseMove)
      $body.on('mouseleave', clearHighlight)
    } else {
      $body.off('mousemove', this._onSelectorMouseMove)
      $body.off('mouseleave', clearHighlight)
      if (this._highlightedEl) {
        this._clearHighlight()
      }
    }
  }

  _onSelectorMouseMove = (e) => {
    const $body = this._body()
    if (!$body) return

    let el = e.target
    let $el = $(el)

    const $ancestorHighlight = $el.closest('.__cypress-selector-helper')
    if ($ancestorHighlight.length) {
      $el = $ancestorHighlight
    }

    if ($ancestorHighlight.length || $el.hasClass('__cypress-selector-helper')) {
      const $highlight = $el
      $highlight.css('display', 'none')
      el = this._document().elementFromPoint(e.clientX, e.clientY)
      $el = $(el)
      $highlight.css('display', 'block')
    }

    if (this._highlightedEl === el) return

    this._highlightedEl = el

    const selector = dom.getBestSelector(el)

    dom.addOrUpdateSelectorHelperHighlight({
      $el,
      selector,
      $body,
      showTooltip: true,
      onClick: () => {
        selectorHelperModel.setNumElements(1)
        selectorHelperModel.resetMethod()
        selectorHelperModel.setSelector(selector)
      },
    })
  }

  _clearHighlight = () => {
    const $body = this._body()
    if (!$body) return

    dom.addOrUpdateSelectorHelperHighlight({ $el: null, $body })
    if (this._highlightedEl) {
      this._highlightedEl = null
    }
  }

  toggleSelectorHighlight (isShowingHighlight) {
    if (!isShowingHighlight) {
      this._clearHighlight()
      return
    }

    const contents = this._contents()
    let selector = selectorHelperModel.selector

    if (!contents || !selector) return

    let $el

    try {
      if (selectorHelperModel.method === 'contains') {
        const Cypress = eventManager.getCypress()
        $el = contents.find(Cypress.dom.getContainsSelector(selector))
        if ($el.length) {
          $el = Cypress.dom.getFirstDeepestElement($el)
        }
      } else {
        $el = contents.find(selector)
      }
      selectorHelperModel.setValidity(true)
      selectorHelperModel.setNumElements($el.length)
      if ($el.length) {
        dom.scrollIntoView(this._window(), $el[0])
      }
    } catch (err) {
      if (!sizzleRe.test(err.stack)) throw err
      selectorHelperModel.setValidity(false)
    }

    if (!$el || !$el.length) {
      $el = null
    }

    dom.addOrUpdateSelectorHelperHighlight({
      $el,
      selector,
      $body: this._body(),
      showTooltip: false,
    })
  }
}
