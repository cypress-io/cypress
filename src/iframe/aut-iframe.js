/* global $ */

import blankContents from './blank-contents'
import { getElementBoxModelLayers, getHitBoxLayer, getOuterSize } from '../lib/dimensions'
import visitFailure from './visit-failure'

export default class AutIframe {
  constructor (config) {
    this.config = config
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
    this.$iframe.contents().find('body').append(contents)
  }

  detachBody = () => {
    const body = this.$iframe.contents().find('body')
    body.find('script').remove()
    return body.detach()
  }

  setBody = (body) => {
    const contents = this.$iframe.contents()
    contents.find('body').remove()
    contents.find('html').append(body)
  }

  highlightEl = ($el, options = {}) => {
    this.$iframe.contents().find('[data-highlight-el],[data-highlight-hitbox]').remove()

    let dom
    if (options.dom) {
      dom = options.dom
      $el = options.dom.find(`[${options.highlightAttr}]`)
    } else {
      dom = this.$iframe.contents().find('body')
    }

    // scroll the top of the element into view
    if ($el.get(0)) {
      $el.get(0).scrollIntoView()
      // if we have a scrollBy on our command
      // then we need to additional scroll the window
      // by these offsets
      const scrollBy = options.scrollBy
      if (scrollBy) {
        this.$iframe.prop('contentWindow').scrollBy(scrollBy.x, scrollBy.y)
      }
    }

    $el.each((__, el) => {
      el = $(el)
      // bail if our el no longer exists in the parent dom
      if (!$.contains(dom[0], el[0])) return

      // switch to using outerWidth + outerHeight
      // because we want to highlight our element even
      // if it only has margin and zero content height / width
      const dimensions = getOuterSize(el)
      // dont show anything if our element displaces nothing
      if (dimensions.width === 0 || dimensions.height === 0) return

      getElementBoxModelLayers(el, dom).attr('data-highlight-el', true)
    })

    const coords = options.coords
    if (coords) {
      requestAnimationFrame(() => {
        getHitBoxLayer(coords, dom).attr('data-highlight-hitbox', true)
      })
    }
  }
}
