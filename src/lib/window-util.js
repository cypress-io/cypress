/* global $ */

import { action } from 'mobx'

export default {
  monitorWindowResize (state) {
    const $window = $(window)
    $window.on('resize', action('window:resize', () => {
      state.updateWindowDimensions($window.width(), $window.height())
    })).trigger('resize')
  },

  specFile () {
    if (location.hash) {
      const match = location.hash.match(/tests\/(.*)$/)
      return match && match[1] || ''
    } else {
      return ''
    }
  },
}
