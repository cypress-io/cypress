export default function sortBrowsers (browsers) {
  return browsers.sort((a, b) => a.displayName > b.displayName ? 1 : -1)
}
