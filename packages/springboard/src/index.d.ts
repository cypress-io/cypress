declare global {
  interface Window {
    App: {
      start: () => void
    }
  }
}

export {}