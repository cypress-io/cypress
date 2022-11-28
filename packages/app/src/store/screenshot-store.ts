import { defineStore } from 'pinia'

export interface ScreenshotStore {
  isScreenshotting: boolean
}

export const useScreenshotStore = defineStore({
  id: 'screenshot',

  state: (): ScreenshotStore => {
    return {
      isScreenshotting: false,
    }
  },

  actions: {
    setScreenshotting (isScreenshotting: boolean) {
      updateScreenshotStyles(isScreenshotting)
      this.isScreenshotting = isScreenshotting
    },
  },
})

function updateScreenshotStyles (isScreenshotting) {
  // we directly set this css on the body for screenshots
  // to short-circuit any Vue logic around when/how the DOM
  // should update, since that can cause screenshots to be
  // taken before the DOM is ready

  if (isScreenshotting) {
    document.body.classList.add('is-screenshotting')
  } else {
    document.body.classList.remove('is-screenshotting')
  }
}
