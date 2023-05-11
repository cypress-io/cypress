import _ from 'lodash'
import path from 'path'
import entriesToCsv from '../../../../../cypress-network-perf-reprod/lib/entries-to-csv'

// interface ResourceTiming extends Protocol.Network.ResourceTiming {
//   requestWallTime: number
//   requestStartTime: number
//   responseFinishTime: number
// }

// interface ResourceTimings {
//   url: string
//   method: string
//   resourceType?: string
//   mimeType?: string
//   httpVersion?: string
//   requestId: string
//   requestWallTime: number
//   requestStartTime: number
//   responseFinishTime?: number
//   timing?: Protocol.Network.ResourceTiming
// }

type HarTiming = {
  'requestId': string
  'method': string
  'url': string
  'resourceType': string | undefined
  'mimeType': string | undefined
  'httpVersion': string | undefined
  'duration': number
  'time': number
  'time.non-queueing': number
  'time.non-blocking': number
  'time.non-stalling': number
  'timings.queued': number
  'timings.stalled': number
  'timings.blocked': number
  'timings.dns': number
  'timings.connect': number
  'timings.ssl': number
  'timings.send': number
  'timings.wait': number
  'timings.receive': number
} | undefined

export const harCapture = (timings, duration) => {
  const leastNonNegative = (values: number[]) => {
    return values.reduce((best: number, value: number) => {
      return (value >= 0 && value < best) ? value : best
    }, Infinity)
  }

  // const entries: ResourceTimings[] = _.map(timings, 'timings')
  const entries = _
  .chain(timings)
  .map((entry): HarTiming => {
    const { requestId, url, method, resourceType, mimeType, httpVersion, requestStartTime, responseFinishTime, timing } = entry

    if (!requestStartTime || !responseFinishTime || !timing) {
      return
    }

    const duration = (responseFinishTime - requestStartTime) * 1000.0

    // Order of events: request_start = 0, [proxy], [dns], [connect [ssl]], [send], duration

    const _blocked_queueing = (timing.requestTime - requestStartTime) * 1000.0

    const stalled = leastNonNegative([timing.dnsStart, timing.connectStart, timing.sendStart])

    const blocked = _blocked_queueing + stalled

    // const devToolsHarBlocked = _blocked_queueing + stalled

    const dns = (timing.dnsEnd - timing.dnsStart)

    const connect = (timing.connectEnd - timing.connectStart)

    // const devToolsHarConnect = timing.connectEnd - leastNonNegative([timing.dnsEnd, stalled])

    const ssl = (timing.sslEnd - timing.sslStart)

    const send = (timing.sendEnd - timing.sendStart)

    const wait = (timing.receiveHeadersEnd - timing.sendEnd)

    const receive = ((responseFinishTime - timing.requestTime) * 1000.0) - timing.receiveHeadersEnd

    // "ssl" is included in the connect field, so do not double count it.
    // for (const t of [timings.blocked, timings.dns, timings.connect, timings.send, timings.wait, timings.receive])
    //   time += Math.max(t, 0);

    // http://www.softwareishard.com/blog/har-12-spec/#entries
    //
    // blocked [number, optional] - Time spent in a queue waiting for a network connection. Use -1 if the timing does not apply to the current request.
    // dns [number, optional] - DNS resolution time. The time required to resolve a host name. Use -1 if the timing does not apply to the current request.
    // connect [number, optional] - Time required to create TCP connection. Use -1 if the timing does not apply to the current request.
    // send [number] - Time required to send HTTP request to the server.
    // wait [number] - Waiting for a response from the server.
    // receive [number] - Time required to read entire response from the server (or cache).
    // ssl [number, optional] (new in 1.2) - Time required for SSL/TLS negotiation. If this field is defined then the time is also included in the connect field (to ensure backward compatibility with HAR 1.1). Use -1 if the timing does not apply to the current request.
    // comment [string, optional] (new in 1.2) - A comment provided by the user or the application.
    //
    // entry.time == entry.timings.blocked + entry.timings.dns +
    // entry.timings.connect + entry.timings.send + entry.timings.wait +
    // entry.timings.receive;

    const time = _.sum([blocked, dns, connect, send, wait, receive])

    return {
      requestId,
      method,
      url,
      resourceType,
      mimeType,
      httpVersion,
      duration,
      time,
      'time.non-queueing': time - _blocked_queueing,
      'time.non-stalling': time - stalled,
      'time.non-blocking': time - blocked,
      'timings.queued': _blocked_queueing,
      'timings.stalled': stalled,
      'timings.blocked': blocked,
      'timings.dns': dns,
      'timings.connect': connect,
      'timings.ssl': ssl,
      'timings.send': send,
      'timings.wait': wait,
      'timings.receive': receive,
      // 'devToolsHarTimings.stalled': devToolsHarBlocked,
      // 'devToolsHarTimings.connect': devToolsHarConnect,
    }
  })
  .compact()
  .value()

  entriesToCsv.harTiming({
    project: 'cypress',
    fileName: 'cypress',
    __dirname: path.resolve(__dirname, '../../../../../cypress-network-perf-reprod/v12'),
    devtools: false,
    httpVersion: 'http1',
    proxy: true,
    exec: process.versions.electron ? 'electron' : 'node',
    duration,
    timings,
    entries,
  })
}
