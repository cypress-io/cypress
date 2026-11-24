// Page code that derives URLs from `location.pathname` can land in the
// Cypress-reserved namespaces (`/__cypress/`, `/__/`) with a path nothing
// serves. Those requests must complete with a 404 rather than hang.

const RESERVED_PATHS = [
  '/__cypress/repro-check',
  // `location.pathname.substring(0, i + 1)` + '/config.js' under /__cypress/src/
  '/__cypress//config.js',
  '/__/does-not-exist',
]

// A sync XHR freezes the renderer until it is answered, so it cannot be
// bounded with a timeout. The async fetches run first so that a regression
// is reported against the request that never settled.
const syncXhrStatus = (url: string) => {
  const xhr = new XMLHttpRequest()

  xhr.open('GET', url, false)
  xhr.send()

  return xhr.status
}

describe('unowned Cypress-reserved paths', () => {
  it('answers a sync XHR outside the reserved namespaces (control)', () => {
    expect(syncXhrStatus('/not-a-cypress-path')).to.eq(404)
  })

  RESERVED_PATHS.forEach((path) => {
    it(`answers an async fetch to ${path}`, async () => {
      const res = await fetch(path, { signal: AbortSignal.timeout(5000) })

      expect(res.status).to.eq(404)
    })
  })

  RESERVED_PATHS.forEach((path) => {
    it(`answers a sync XHR to ${path}`, () => {
      expect(syncXhrStatus(path)).to.eq(404)
    })
  })
})
