import react from 'eslint-plugin-react'

// Turning the rules off, rather than unregistering the plugin, keeps `react/*`
// rule settings and eslint-disable directives valid in the files it applies to
export const reactRulesOff = Object.fromEntries(
  Object.keys(react.rules).map((name) => [`react/${name}`, 'off'] as const),
)
