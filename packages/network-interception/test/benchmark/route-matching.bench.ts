import { bench, describe } from 'vitest'
import {
  matchRoutes,
  matchesRoutePreflight,
  type RouteMatchableRequest,
} from '../../lib/core/route-matching'

type BackendRoutes = Parameters<typeof matchRoutes>[0]

/*
 * Benchmarks the per-request route matching hot path. `matchesRoutePreflight`
 * and `matchRoutes` run for every request that flows through the proxy, so
 * each benched operation replays a realistic mix of traffic — mostly
 * non-matching static asset and third-party requests, plus API calls and the
 * occasional CORS preflight — against route sets of increasing size.
 *
 * Run with:
 *   yarn workspace @packages/network-interception bench
 *
 * To compare against a saved baseline:
 *   yarn workspace @packages/network-interception bench --outputJson bench.json
 *   ... make changes ...
 *   yarn workspace @packages/network-interception bench --compare bench.json
 */

const REQUEST_COUNT = 1000

const makeRoutes = (count: number): BackendRoutes => {
  const routes: any[] = []

  for (let i = 0; i < count; i++) {
    const kind = i % 10
    let routeMatcher

    if (kind < 4) {
      routeMatcher = { url: `**/api/resource${i}/*` }
    } else if (kind < 6) {
      routeMatcher = { method: 'POST', url: `**/api/resource${i}` }
    } else if (kind < 8) {
      routeMatcher = { url: new RegExp(`/api/resource${i}/\\d+$`) }
    } else if (kind === 8) {
      routeMatcher = { url: `**/api/resource${i}/*`, headers: { 'x-client': `client-${i}` } }
    } else {
      routeMatcher = { middleware: true, url: '**/api/**' }
    }

    routes.push({ id: String(i + 1), routeMatcher })
  }

  return routes as BackendRoutes
}

const commonHeaders = {
  'accept': 'application/json, text/plain, */*',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  'referer': 'http://localhost:3000/app/dashboard',
  'cookie': 'session=abc123def456; csrf=zyx987',
}

const makeRequests = (count: number, routeCount: number): RouteMatchableRequest[] => {
  const requests: RouteMatchableRequest[] = []

  for (let i = 0; i < count; i++) {
    const kind = i % 20

    if (kind < 6) {
      // API traffic; resource ids cycle past routeCount so some match, some don't
      const resourceId = i % Math.max(routeCount * 2, 20)

      requests.push({
        method: kind < 2 ? 'POST' : 'GET',
        proxiedUrl: `http://localhost:3000/api/resource${resourceId}/${1000 + i}?include=children&page=${i % 7}`,
        headers: { ...commonHeaders, 'x-client': `client-${resourceId}` },
        resourceType: 'xhr',
      })
    } else if (kind === 6) {
      requests.push({
        method: 'OPTIONS',
        proxiedUrl: `https://api.example.com/v2/things/${i}`,
        headers: { ...commonHeaders, 'access-control-request-method': 'POST', origin: 'http://localhost:3000' },
        resourceType: 'xhr',
      })
    } else if (kind < 13) {
      const exts = ['js', 'css', 'png', 'woff2', 'svg', 'map', 'json']

      requests.push({
        method: 'GET',
        proxiedUrl: `http://localhost:3000/assets/chunk-${(i * 2654435761) >>> 16}.${exts[i % exts.length]}?v=4.2.${i % 9}`,
        headers: commonHeaders,
        resourceType: 'other',
      })
    } else {
      const hosts = ['fonts.googleapis.com', 'cdn.segment.io', 'www.google-analytics.com', 'cdn.jsdelivr.net']

      requests.push({
        method: 'GET',
        proxiedUrl: `https://${hosts[i % hosts.length]}/static/lib-${i % 50}/dist/bundle.min.js?dl=${i}`,
        headers: commonHeaders,
        resourceType: 'script',
      })
    }
  }

  return requests
}

for (const routeCount of [0, 5, 50, 200]) {
  describe(`route matching — ${routeCount} routes`, () => {
    const routes = makeRoutes(routeCount)
    const requests = makeRequests(REQUEST_COUNT, routeCount)

    bench(`${REQUEST_COUNT} proxied requests`, () => {
      for (let i = 0; i < requests.length; i++) {
        matchesRoutePreflight(routes, requests[i])
        matchRoutes(routes, requests[i])
      }
    })
  })
}
