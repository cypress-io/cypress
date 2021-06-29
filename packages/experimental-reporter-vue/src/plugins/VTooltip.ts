import './VTooltip.scss'
import VTooltip from 'v-tooltip'

export const options = {
  // themes: {
    // tooltip: {
      // '$resetCss': true,
      // triggers: ['click', 'hover'],
      // placement: 'bottom',
      // autoHide: true,
      // strategy: 'absolute',
      // handleResize: true,
    // },
  // },
}

export const useTooltip = () => {
  return [VTooltip]
}
