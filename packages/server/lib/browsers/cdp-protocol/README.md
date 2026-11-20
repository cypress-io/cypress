# Cookies on the browser network path

Chrome, Chromium and Edge don't send test traffic through Cypress's HTTP proxy. Cypress intercepts it inside the browser with the CDP Fetch domain instead, which is the default whenever [`isBrowserNetworkMode`](../../util/network-mode.ts) returns true. Firefox, WebKit and Electron, and any browser run with the deprecated `forceHttp1` option, stay on the proxy.

This page explains how cookies work on the browser network path, and where the result differs from the proxy. The detailed rules live in the doc comments of the files it links to, so read those before changing the behavior.

## Shared middleware

The request and response middleware in [`@packages/proxy`](../../../../proxy/lib/http/) runs on both paths, unchanged. It is the ordered pipeline the HTTP proxy runs on every request and response, and it includes both the cookie steps and the `cy.intercept()` handlers. [`network-runtime.ts`](../../network-runtime.ts) runs the same `NetworkProxy` pipeline over a synthetic Express request and response built from each Fetch pause, and no cookie step checks which path it is on. The server-side cookie jar is the same singleton on both paths.

What differs is the browser around that middleware:

| | Proxy path | Browser network path |
| --- | --- | --- |
| Who stores a response's cookies | The browser, from the headers the proxy sends it, after the response middleware, including `cy.intercept()`, has run | Chrome, from the origin's headers, **before** pausing the response for the response middleware |
| Where Cypress reads `Set-Cookie` | The upstream response | `Network.responseReceivedExtraInfo`, because Fetch pauses never include it |
| How a `cy.intercept()` handler's `Set-Cookie` changes reach the browser | The browser receives them as the response headers | [`cdp-set-cookie-sync.ts`](./cdp-set-cookie-sync.ts) writes them into Chrome's store with CDP cookie commands |

## A request on the browser network path

1. Chrome pauses the request (`Fetch.requestPaused`). The pause already carries the `Cookie` header Chrome is about to send, for documents and for `fetch()`/XHR alike, so the middleware's `req.cookies` is populated the same way as on the proxy path. [`cdp-fetch-transport.ts`](./cdp-fetch-transport.ts) marks AUT-frame documents with an `x-cypress-is-aut-frame` header. The request middleware reads it to tell those documents apart from other requests, then strips it before the request goes out.
2. The request middleware runs. When the AUT isn't on the primary origin, or the request is for the AUT frame, the middleware *simulates top*: it treats the AUT URL as the top-level page when deciding which cookies apply. In that case `MaybeAttachCrossOriginCookies` adds the jar's cookies for the URL to the `Cookie` header, with the jar winning on a name clash. The `cy.intercept()` request handler runs after it.
3. If the middleware changed any header, the transport sends the full header list with `Fetch.continueRequest`. Otherwise it sends none and Chrome's own headers stand. A `Cookie` header in that list replaces the one Chrome would have sent. Leaving `Cookie` out of the list does not remove it: Chrome adds its stored cookies back. So when the middleware removes the `Cookie` header Chrome paused with, the transport sends an empty one in its place. For a request a `cy.intercept()` route matched, the transport also reads Chrome's whole cookie store with `Network.getAllCookies`, sent just before `Fetch.continueRequest` in the same tick. Chrome answers that read before it stores the response's cookies, so it is the store as it was before the response, which [the cookie sync](#syncing-chromes-store-with-the-handlers-headers) restores from.

Top simulation decides which cookies are same-site by comparing against the AUT's current URL, so that URL has to stay current. The middleware records it whenever it handles an AUT document, which on the proxy path is every time. On the browser network path, a navigation can commit without a Fetch pause, so the middleware never sees it. Chrome pauses documents it serves from its HTTP cache, but not a page it restores from the back/forward cache. The runtime therefore also records the URL on every http(s) navigation of the AUT frame (`onAUTFrameNavigated` in `network-runtime.ts`). Other schemes are ignored, so the `about:blank` that test isolation loads between tests is never recorded as top.

## A response on the browser network path

1. Chrome receives the response, **stores the origin's `Set-Cookie` headers**, then pauses it. Neither `Fetch.continueResponse` nor `Fetch.fulfillRequest` reverts that store.
2. The pause has no `Set-Cookie`. The transport takes the raw headers from `Network.responseReceivedExtraInfo`, along with the lines Chrome blocked and the cookie partition key, and merges them into the response (`resolveCookieHeaders`).
3. The response middleware runs:
   - `InterceptResponse`: the `cy.intercept()` response handler can edit, add or remove `Set-Cookie` headers.
   - `MaybeCopyCookiesFromIncomingRes`: every cookie left on the response is written to the server-side cookie jar, unless the browser would refuse it with the AUT URL as the top-level page. [`CookiesHelper.setCookie`](../../../../proxy/lib/http/util/cookies.ts) holds those checks. When top is simulated, the newly added cookies are also sent to the driver, which adds them to the browser with `Cypress.automation('add:cookies')`. The response is held until the driver acknowledges them.
   - `MaybeSendRedirectToClient` and `ClearCyInitialCookie` add Cypress's own `__cypress.initial` and `__cypress.unload` cookies.
4. `syncSetCookies` brings Chrome's store in line with the `Set-Cookie` headers the response now carries. See [the next section](#syncing-chromes-store-with-the-handlers-headers).
5. The response is released: with `Fetch.fulfillRequest` if the middleware changed the body or content type, otherwise with `Fetch.continueResponse`. Chrome stores `Set-Cookie` headers sent with `Fetch.fulfillRequest`, but ignores any sent with `Fetch.continueResponse`, redirects included.

Cypress's own cookies depend on that difference. `ClearCyInitialCookie` expires `__cypress.initial` and `__cypress.unload` only on documents it injects into, and injection changes the body, so those responses are fulfilled and Chrome applies the expiry. The `__cypress.initial=true` that `MaybeSendRedirectToClient` adds to a redirect goes out on a continued response and is never stored. That's harmless, since it is only added when the request already carried the same value.

Because the sync runs before the response is released, the page, and the next hop of a redirect, already see the synced cookies. Each redirect hop is its own pause, with its own extraInfo and its own sync.

## Syncing Chrome's store with the handler's headers

Chrome has already stored the origin's cookies by the time a `cy.intercept()` handler runs, so edited headers alone don't change it. [`planSetCookieSync`](./cdp-set-cookie-sync.ts) compares the origin's headers with the final ones and returns the CDP commands that close the gap. The transport sends them before it releases the response.

- **Cookie the handler no longer sets:** deleted with `Network.deleteCookies`, but only if Chrome holds the origin's value. If the origin's header overwrote a cookie Chrome already held, the sync writes that earlier cookie back into Chrome's store. It takes the earlier cookie from the store read made as the request was continued, which covers a cookie on another path, such as one a `Path=/other` header overwrote on a request to `/page`. If the read fails, the sync is skipped, since deleting the origin's cookie without the earlier one to put back would leave the page without a cookie it had. When the origin's header was already expired, it deleted a cookie rather than storing one, so there is nothing to delete: the sync only restores the cookie it deleted, without reading Chrome's store.
- **Cookie the handler added or changed:** written with `Network.setCookie` on a continued response. A handler cookie that is already expired is written with a past expiry, which deletes it, as the header would. On a fulfilled response Chrome stores the handler's headers itself, so only the removals are sent.
- **No change:** when no middleware touched the headers, or the `Set-Cookie` lines match the origin's exactly and in the same order, Chrome's store is neither read nor written.

The sync ignores `__cypress.*` cookies. It reads Chrome's store with `Network.getAllCookies` at most once per response, and only when a removal or write needs checking against it.

### Why the sync works the way it does

- **Headers are paired by the cookie Chrome stores.** The origin's and the handler's headers are matched on name, resolved domain, path and partition, and the later header for that cookie replaces an earlier one. Chrome resolves `Domain=` when it stores a cookie, so two different headers can land on one cookie, such as `Domain=localhost` and no `Domain=` on `localhost`. Dropping one of them leaves the cookie in place when the other still describes what Chrome stored. `cookieStoreDomain` resolves each header the way Chrome does, so a header can be matched against what Chrome reports.
- **Removals come before writes, and never name a cookie the handler kept.** A cookie moved to a different domain, path or partition is cleared from where the origin stored it, then the handler's cookie is written. A second header for the same stored cookie is not a removal.
- **A stored cookie counts as this response's only if its value matches too.** Chrome reports a line as unblocked even when it stored nothing, such as for a request sent without credentials. Matching on name, domain and path alone could pick up an older cookie that this response never touched, and deleting it would remove a cookie the proxy path keeps.
- **Restoring errs toward restoring.** Every cookie in that earlier store that the origin's header could have overwritten is written back. Writing back a cookie the header didn't touch leaves it unchanged, but missing one leaves it deleted.
- **Blocked lines are excluded on both sides.** A line Chrome blocked in the origin's response is never written, and doesn't count as the handler keeping the origin's cookie. Lines are matched by value and every attribute, so a copy the handler re-serialized still matches, but a copy it edited, even only the value, is a new cookie and is written.
- **No extraInfo means no sync, not an empty baseline.** Comparing against no origin headers would treat every handler cookie as new and write it past Chrome's checks, blocked ones included.
- **Partitioned cookies need an addressable partition key.** Each top-level site has its own partitioned jar, which CDP can only address by key. Without one, a write would land in the unpartitioned jar and overwrite an unrelated cookie, and a lookup couldn't tell whether Chrome stored the cookie.

## Other ways cookies reach Chrome

None of these are specific to this path.

- **`cy.getCookie()`, `cy.setCookie()`, `cy.clearCookies()` and the rest** use CDP `Network.*` cookie commands on Chrome's store, through [`cdp_automation.ts`](./cdp_automation.ts). They never read the server-side jar. [`automation.ts`](../../automation/automation.ts) mirrors `set:cookie` into the jar (`syncSetCookieToJar`) for a cookie the jar already holds, and mirrors `clear:cookie(s)`, so a stale jar copy can't overwrite the browser's value on the next cross-origin request.
- **`cy.visit()`** to an http(s) URL fetches the document in Node first, and that response's cookies are set in Chrome over automation. The browser's own request for the document is answered at the request stage from the buffered response (`MaybeEndRequestWithBufferedResponse`), and the response middleware still runs on it. Chrome sends nothing on the wire, so there is no extraInfo and no sync for that response. Visits to local files are released to Express instead, which serves them the same way as on the proxy path.
- **`cy.request()`** sets its response cookies in Chrome over automation, the same as on the proxy path.

## Differences from the proxy path

Most of these follow from Chrome storing cookies before the response middleware runs, and from CDP being the only way to correct its store afterwards. The last comes from how `Fetch.continueRequest` treats a missing `Cookie` header. The sync's own doc comment explains those in more detail.

- **Chrome's blocking rules are skipped for handler cookies.** `Network.setCookie` bypasses the checks Chrome applies to a `Set-Cookie` header, third-party cookie rules included. A cookie a handler adds or edits can be stored where the browser would have refused the same header. Lines Chrome already blocked in the origin's response are never written as they are, but a handler's edited copy of one is.
- **Requests sent without credentials**, such as `fetch()` with `credentials: 'omit'`, or a cross-origin `fetch()` or XHR left at its default. Chrome ignores every `Set-Cookie` in their responses, yet still reports the lines as unblocked. The sync works out whether anything was stored by checking whether Chrome holds any of the origin's values. When the origin set no cookies, or only expired ones, there's nothing to check, so a handler's added cookies are written even though Chrome would have ignored them as headers.
- **HTTP cache and service-worker responses.** Chrome emits no extraInfo for these, so there are no origin headers to compare against and the sync doesn't run. A handler's edits and removals have no effect. A cookie it adds is stored only if the handler also fulfills the response, for example by replacing the body.
- **Partitioned (CHIPS) cookies** are synced only when Chrome reports a partition key it can address. With an opaque key they are skipped. The server-side jar and the `cy` cookie commands don't model partitions on either path.
- **The origin's values are briefly visible.** Until the sync runs, other requests and page scripts can see the cookies the origin set, including ones the handler removes or changes.
- **A request handler that rewrites `req.url` to another host.** Chrome sends the request to the rewritten host, so it stores the response's cookies there, and the server-side jar records them under the same host. On the proxy path, the browser stores them under the host it requested, while the jar records them under the rewritten host.
- **A removed `Cookie` header arrives empty.** When a `cy.intercept()` request handler deletes `req.headers.cookie`, the transport sends an empty `Cookie` header, because Chrome adds its stored cookies back when the header is missing. The server gets no cookies, as on the proxy path, but sees an empty header where the proxy path sends none.

## Debugging

- `DEBUG=cypress:server:browsers:cdp-fetch-transport` logs the extraInfo merge (`merged N set-cookie header(s)`), every sync command (`syncing set-cookie for …`), and a failed read of Chrome's store (`could not read Chrome's cookie store`).
- `DEBUG=cypress:server:browsers:cdp-network-extra-info` logs whether a response pause waited for its extraInfo, and when the wait timed out, which leaves that response unsynced.
- [`cdp-set-cookie-sync.spec.ts`](../../../test/unit/browsers/cdp-set-cookie-sync.spec.ts) covers `planSetCookieSync`'s edge cases, and is the fastest place to reproduce one.
- `DEBUG=cypress-verbose:proxy:http` logs the proxy middleware's cookie decisions, such as whether jar cookies are attached to a request.
- [`set_cookie_sync.cy.ts`](../../../../../system-tests/projects/e2e/cypress/e2e/set_cookie_sync.cy.ts), run by `cookies_spec.ts` in Chrome only, is the end-to-end check for the sync, including across a redirect, and for a request handler removing the `Cookie` header.
