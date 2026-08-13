# grpc-web-h2

Standalone dual-stack HTTP/2 gRPC-Web origin, used to evaluate gRPC-Web
support through Cypress — pass-through, `cy.intercept` spying, request-body
rewriting, server streaming, and stubbing — with the MITM proxy enabled and
disabled.

Written for the investigation into
[discussion #19085](https://github.com/cypress-io/cypress/discussions/19085)
("can `cy.intercept` stub a gRPC call?") against the HTTP/2 work.

gRPC-Web rather than native gRPC is the shape under test on purpose: native
gRPC carries its status in HTTP trailers, which no browser exposes to
JavaScript, so browser applications always speak gRPC-Web. The wire format is
still binary and still puts `grpc-status` in a trailer *frame* inside the
response body, which is what makes it a stress test for an interception layer:

```
byte 0     flags — 0x00 data frame, 0x80 trailer frame
bytes 1-4  payload length, big endian
bytes 5..  payload (protobuf for data frames, `k:v\r\n` text for trailer frames)
```

Like `http2-dual-stack`, the origin runs out-of-band as a plain node script
rather than inside the system-tests harness (see #34308).

## Running locally

```bash
# terminal 1 — the origin (self-signed certs are generated on first run)
node system-tests/projects/grpc-web-h2/server.mjs

# terminal 2 — proxy disabled: in-page gRPC-Web calls negotiate HTTP/2.0
CYPRESS_INTERNAL_DISABLE_PROXY=1 yarn cypress:run \
  --project system-tests/projects/grpc-web-h2 --browser chrome

# contrast — proxy enabled: the MITM terminates browser connections, so
# gRPC-Web downgrades to HTTP/1.1 (which gRPC-Web is designed to run over)
yarn cypress:run --project system-tests/projects/grpc-web-h2 \
  --browser chrome --expose expectedBrowserProtocol=1.1
```

The origin logs the protocol, the decoded message, and the raw byte count for
every call, so the server log shows whether each binary body reached it intact.

## Status

This project is a reproduction, not a passing regression suite, and is
deliberately not wired into CI. With the proxy enabled every spec passes. With
`CYPRESS_INTERNAL_DISABLE_PROXY=1` five fail, on three distinct defects in the
CDP Fetch transport:

`grpc-web.cy.js`:

| spec | proxy enabled | proxy disabled |
| --- | --- | --- |
| passes through unintercepted | pass (HTTP/1.1) | pass (HTTP/2.0) |
| can be spied on | pass | pass |
| shows the whole non-UTF8 request body | pass | **fail** — `req.body` is 13 of 17 bytes |
| sends a rewritten request body | pass | **fail** — rewrite silently dropped |
| delivers a server-streaming call progressively | pass | **fail** — whole body buffered |
| can be stubbed with an ArrayBuffer body | pass | pass |

`json-rewrite.cy.js` — ordinary JSON and text POSTs, no gRPC involved,
isolating the rewrite defect from anything binary:

| spec | proxy enabled | proxy disabled |
| --- | --- | --- |
| passes an unmodified JSON body through | pass | pass |
| sends a rewritten JSON body | pass | **fail** — origin gets the original body |
| sends a rewritten text body | pass | **fail** — origin gets the original body |

1. **Truncated request bodies.** `cdp-fetch-transport.ts` builds `req.body`
   from `Fetch.requestPaused`'s `request.postData`, which Chrome serializes as
   a UTF-8 string and truncates at the first byte that is not valid UTF-8. The
   same event carries `request.postDataEntries[].bytes`, base64 and complete.
2. **Dropped request-body rewrites.** `cdp-fetch-codec.ts` puts a raw string
   in `Fetch.continueRequest`'s `postData`, but CDP types that parameter as
   `binary`, i.e. base64. Chrome rejects the command
   (`Failed to deserialize params.postData - BINDINGS: invalid base64 string`)
   and the transport's error path continues the request unmodified, so
   assigning `req.body` in an intercept handler is a silent no-op. Nothing
   about this is gRPC- or binary-specific: `json-rewrite.cy.js` shows it with
   a plain `req.body = { a: 2 }` on an `application/json` POST. The response
   pause is orphaned by the same error path, so `cy.wait()` on that route
   never yields a response either.
3. **Buffered streaming responses.** `Fetch.enable` subscribes to
   `requestStage: 'Response'`, which makes Chrome withhold the whole response
   body until the pause is resolved. This applies to every response, whether
   or not an intercept matches.

`cdp-streaming-probe.mjs` isolates (3) from Cypress entirely — it drives Chrome
over raw CDP against a streaming origin three ways and prints when each chunk
reached the page:

```bash
node system-tests/projects/grpc-web-h2/cdp-streaming-probe.mjs

Fetch disabled               chunk arrivals (ms): [4,305,606]
Request stage only           chunk arrivals (ms): [7,307,608]
Request + Response stages    chunk arrivals (ms): [913]
```
