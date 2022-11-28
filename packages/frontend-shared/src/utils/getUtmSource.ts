export type LoginUtmSource = 'Binary: App' | 'Binary: Launchpad'

// __CYPRESS_MODE__ is only set on the window in th browser app -
// checking this allows us to know if links are clicked in the browser app or the launchpad
export function getUtmSource (): LoginUtmSource {
  return window.__CYPRESS_MODE__ ? 'Binary: App' : 'Binary: Launchpad'
}
