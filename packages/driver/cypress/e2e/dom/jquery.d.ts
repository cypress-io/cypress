declare global {
  interface Window {
    jquery: () => void | undefined | null
  }
}

export {}
