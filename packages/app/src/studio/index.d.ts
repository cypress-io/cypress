declare type React = typeof import('react')
declare type ReactDOM = typeof import('react-dom/client')

declare module 'app-studio' {
  export const mountTestGenerationPanel = (
    reactInstance: React,
    reactDOMInstance: ReactDOM,
    container: HTMLElement,
  ) => {}
}
