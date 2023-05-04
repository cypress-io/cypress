import { performance, PerformanceObserver } from 'perf_hooks'
import { telemetry } from '@packages/telemetry'
import { Http, ServerCtx } from './http'

import type { BrowserPreRequest } from './types'

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach((item) => {
    // eslint-disable-next-line no-console
    console.log(item.toJSON())
  })
})

obs.observe({ buffered: true, entryTypes: ['function'] })
export class NetworkProxy {
  http: Http

  constructor (opts: ServerCtx) {
    this.http = new Http(opts)
    const handleHttpRequest = this.http.handleHttpRequest

    this.http.handleHttpRequest = performance.timerify(handleHttpRequest)
  }

  addPendingBrowserPreRequest (preRequest: BrowserPreRequest) {
    this.http.addPendingBrowserPreRequest(preRequest)
  }

  handleHttpRequest (req, res) {
    const span = telemetry.startSpan({
      name: 'network:proxy:handleHttpRequest',
      opts: {
        attributes: {
          url: req.proxiedUrl,
        },
      },
    })

    this.http.handleHttpRequest(req, res, span).finally(() => {
      span?.end()
    })
  }

  handleSourceMapRequest (req, res) {
    this.http.handleSourceMapRequest(req, res)
  }

  setHttpBuffer (buffer) {
    this.http.setBuffer(buffer)
  }

  reset () {
    this.http.reset()
  }
}
