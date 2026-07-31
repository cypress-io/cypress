import debugModule from 'debug'

const NAMESPACE = 'cypress:network-interception'

export const debug = {
  core: debugModule(`${NAMESPACE}:core`),
  http: debugModule(`${NAMESPACE}:http`),
  routes: debugModule(`${NAMESPACE}:routes`),
  policies: debugModule(`${NAMESPACE}:policies`),
  document: debugModule(`${NAMESPACE}:document`),
}
