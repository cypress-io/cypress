import $ from 'cash-dom'

const plugins = {
  mocha() {

  }
}

export function getPlugins() {
  return Object.entries(plugins).map(p => p[1])
}
