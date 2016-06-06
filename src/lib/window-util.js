/* global $ */

import { action } from 'mobx'

export default {
  monitorWindowResize (uiState) {
    const $window = $(window)
    $window.on('resize', action('window:resize', () => {
      uiState.updateWindowDimensions($window.width(), $window.height())
    })).trigger('resize')
  },

  specSrc () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)
      return match[1]
    } else {
      // TODO: what should be returned in this scenario and how should caller react?
      return ''
    }
  },
}
