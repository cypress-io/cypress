import debugModule from 'debug'

const NS = 'cypress:network-interception'

export const debug = {
  core: debugModule(`${NS}:core`),
  http: debugModule(`${NS}:http`),
  routes: debugModule(`${NS}:routes`),
  policies: debugModule(`${NS}:policies`),
  document: debugModule(`${NS}:document`),
}
