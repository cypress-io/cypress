import { TapManager } from '../tap-manager'
import { tapLiveDom } from './dom'

const CYPRESS_VERSION = '15.0.0'

// A minimal stand-in for the AUT document: the handler only reads location,
// documentElement, and querySelectorAll.
const makeDoc = (html: string, url?: string) => {
  const root = document.createElement('html')

  root.innerHTML = html

  return {
    location: url ? { href: url } : null,
    documentElement: root,
    querySelectorAll: (selector: string) => root.querySelectorAll(selector),
  }
}

describe('tap/commands/dom', () => {
  const stubDocument = (doc: unknown) => cy.stub(tapLiveDom, 'getDocument').returns(doc)

  it('fails with NO_DOM when the app under test has no readable document', async () => {
    stubDocument(undefined)

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom')

    expect((outcome as { error: { code: string } }).error.code).to.eq('NO_DOM')
  })

  it('returns the current document HTML and url when no selector is given', async () => {
    stubDocument(makeDoc('<head></head><body><main id="app">hi</main></body>', 'http://localhost:8080/app'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom')

    const result = (outcome as { result: any }).result

    expect(result.url).to.eq('http://localhost:8080/app')
    expect(result.html).to.contain('<main id="app">hi</main>')
    expect(result.matches).to.be.undefined
    expect(result.truncated).to.be.undefined

    expect(JSON.parse(JSON.stringify(outcome))).to.deep.eq(outcome)
  })

  it('omits the url when the document exposes no location', async () => {
    stubDocument(makeDoc('<head></head><body><main>hi</main></body>'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom')

    expect((outcome as { result: any }).result.url).to.be.undefined
  })

  it('scopes to a CSS selector, returning the matching elements', async () => {
    stubDocument(makeDoc('<head></head><body><input data-testid="username-input"><input data-testid="password-input"></body>'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom', { selector: 'input' })

    const result = (outcome as { result: any }).result

    expect(result.matches.count).to.eq(2)
    expect(result.matches.html[0]).to.contain('data-testid="username-input"')
    expect(result.html).to.be.undefined
  })

  it('reports a zero-count match as a result, not an error', async () => {
    stubDocument(makeDoc('<head></head><body></body>'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom', { selector: '[data-testid="username"]' })

    expect((outcome as { result: any }).result.matches).to.deep.eq({ count: 0, html: [] })
  })

  it('fails with INVALID_SELECTOR for a malformed selector', async () => {
    stubDocument(makeDoc('<head></head><body></body>'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom', { selector: '>>bad' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_SELECTOR')
  })

  it('truncates HTML past --max-chars and flags it', async () => {
    stubDocument(makeDoc('<head></head><body><main>a lot of content here</main></body>'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom', {}, { 'max-chars': '12' })

    const result = (outcome as { result: any }).result

    expect(result.truncated).to.eq(true)
    expect(result.html.length).to.eq(12)
  })

  it('rejects a non-positive --max-chars before reading the document', async () => {
    const getDocument = stubDocument(makeDoc('<head></head><body></body>'))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('dom', {}, { 'max-chars': '0' })

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_MAX_CHARS')
    expect(getDocument).not.to.have.been.called
  })
})
