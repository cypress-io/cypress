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
      this.isScreenshotting = isScreenshotting
    },
  },
})
