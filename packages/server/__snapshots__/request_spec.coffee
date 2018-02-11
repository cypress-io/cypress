exports['e2e requests passes 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  redirects + requests
    ✓ gets and sets cookies from cy.request
    ✓ visits idempotant
    ✓ automatically follows redirects
    ✓ can turn off automatically following redirects
    ✓ follows all redirects even when they change methods
    ✓ can submit json body
    ✓ can submit form url encoded body
    ✓ can send qs query params
    ✓ passes even on non 2xx or 3xx status code
    ✓ sets Accept header to */* by default
    ✓ can override the accept header
    ✓ issue #375: does not duplicate request cookies on 302 redirect


  12 passing


  (Tests Finished)

  - Tests:           12
  - Passes:          12
  - Failures:        0
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     0
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e requests fails when network immediately fails 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  when network connection cannot be established
    1) fails


  0 passing
  1 failing

  1) when network connection cannot be established fails:
     CypressError: cy.request() failed trying to load:

http://localhost:16795/

We attempted to make an http request to this URL but the request failed without a response.

We received this error at stack trace line

  > Error: connect ECONNREFUSED 127.0.0.1:16795

-----------------------------------------------------------

The request we sent was:

Method: GET
URL: http://localhost:16795/

-----------------------------------------------------------

Common situations why this would fail:
  - you don't have internet access
  - you forgot to run / boot your web server
  - your web server isn't accessible
  - you have weird network configuration settings on your computer

The stack trace for this error is:

RequestError: Error: connect ECONNREFUSED 127.0.0.1:16795
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line
    at stack trace line

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/when network connection cannot be established -- fails.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

exports['e2e requests fails on status code 1'] = `
Started video recording: /foo/bar/.projects/e2e/cypress/videos/abc123.mp4

  (Tests Starting)


  when status code isnt 2xx or 3xx
    1) fails


  0 passing
  1 failing

  1) when status code isnt 2xx or 3xx fails:
     CypressError: cy.request() failed on:

http://localhost:2294/statusCode?code=503

The response we received from your web server was:

  > 503: Service Unavailable

This was considered a failure because the status code was not '2xx' or '3xx'.

If you do not want status codes to cause failures pass the option: 'failOnStatusCode: false'

-----------------------------------------------------------

The request we sent was:

Method: GET
URL: http://localhost:2294/statusCode?code=503
Headers: {
  "user-agent": "foo",
  "accept": "*/*",
  "accept-encoding": "gzip, deflate"
}

-----------------------------------------------------------

The response we got was:

Status: 503 - Service Unavailable
Headers: {
  "x-powered-by": "Express",
  "content-type": "text/plain; charset=utf-8",
  "content-length": "19",
  "etag": "W/13-52060a5f",
  "date": "Fri, 18 Aug 2017 15:01:13 GMT",
  "connection": "close"
}
Body: Service Unavailable

      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line
      at stack trace line




  (Tests Finished)

  - Tests:           1
  - Passes:          0
  - Failures:        1
  - Pending:         0
  - Duration:        10 seconds
  - Screenshots:     1
  - Video Recorded:  true
  - Cypress Version: 1.2.3


  (Screenshots)

  - /foo/bar/.projects/e2e/cypress/screenshots/when status code isnt 2xx or 3xx -- fails.png (1280x720)


  (Video)

  - Started processing:   Compressing to 32 CRF
  - Finished processing:  /foo/bar/.projects/e2e/cypress/videos/abc123.mp4 (0 seconds)


  (All Done)

`

