import agent, { strictAgent } from './agent'
import * as blocked from './blocked'
import * as connect from './connect'
import * as httpUtils from './http-utils'
import * as clientCertificates from './client-certificates'

export {
  agent,
  blocked,
  connect,
  httpUtils,
  clientCertificates,
  strictAgent,
}

export { allowDestroy } from './allow-destroy'

export { concatStream } from './concat-stream'

export { CombinedAgent, shouldProxyForUrl } from './agent'
