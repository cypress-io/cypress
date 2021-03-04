import { unmount } from '@cypress/react'

before(() => {
  window.supportFileWasLoaded = true
})

afterEach(() => {
  unmount()
})
