import { MAX_DERIVED_SELECTORS } from '../contract'
import { tapManagerDataSource } from '../tap-manager-data-source'
import { TapManager } from '../tap-manager'
import type { TapElementSelectorSource } from '../types'

const CYPRESS_VERSION = '15.0.0'

describe('tap/commands/resolve-selector', () => {
  // The spec's own window.Cypress is the instance running this test, so stub the
  // seam rather than reach for live runner state. Elements stand in as opaque
  // handles: the command only passes them back to the selector generator.
  const stubSource = (source: TapElementSelectorSource | undefined) => {
    return cy.stub(tapManagerDataSource, 'getElementSelectorSource').returns(source)
  }

  const sourceOf = (elements: string[], derive: (element: unknown) => string | null): TapElementSelectorSource => {
    return {
      find: () => ({ length: elements.length, item: (index: number) => elements[index] }),
      getSelector: derive,
    }
  }

  const exec = (selector = '.item') => new TapManager(CYPRESS_VERSION).exec('resolve-selector', { selector })

  it('returns a selector per match, in document order', async () => {
    stubSource(sourceOf(['a', 'b', 'c'], (element) => `li[data-i="${element}"]`))

    expect(await exec()).to.deep.eq({
      result: {
        selectors: [
          { index: 0, selector: 'li[data-i="a"]' },
          { index: 1, selector: 'li[data-i="b"]' },
          { index: 2, selector: 'li[data-i="c"]' },
        ],
      },
    })
  })

  it('keeps a match no unique selector could be derived for, with a null selector', async () => {
    stubSource(sourceOf(['a', 'detached', 'c'], (element) => (element === 'detached' ? null : `#${element}`)))

    expect(await exec()).to.deep.eq({
      result: {
        selectors: [
          { index: 0, selector: '#a' },
          { index: 1, selector: null },
          { index: 2, selector: '#c' },
        ],
      },
    })
  })

  it('reports a shadow-scoped selector as none, since it resolves against no document', async () => {
    stubSource(sourceOf(['shadowed', 'a'], (element) => (element === 'shadowed' ? ':host > button' : `#${element}`)))

    expect(await exec()).to.deep.eq({
      result: { selectors: [{ index: 0, selector: null }, { index: 1, selector: '#a' }] },
    })
  })

  it('stops deriving at the cap, so a selector as broad as * cannot pin the app down', async () => {
    const derive = cy.stub().callsFake((element: unknown) => `#e${element}`)
    const elements = Array.from({ length: MAX_DERIVED_SELECTORS + 5 }, (_, index) => String(index))

    stubSource(sourceOf(elements, derive))

    const { selectors } = (await exec('*') as { result: { selectors: { index: number }[] } }).result

    expect(selectors).to.have.length(MAX_DERIVED_SELECTORS)
    expect(selectors[selectors.length - 1].index).to.eq(MAX_DERIVED_SELECTORS - 1)
    expect(derive, 'no work is done for the matches past the cap').to.have.callCount(MAX_DERIVED_SELECTORS)
  })

  it('returns no selectors when the selector matched nothing', async () => {
    stubSource(sourceOf([], () => null))

    expect(await exec('.missing')).to.deep.eq({ result: { selectors: [] } })
  })

  it('fails with NO_AUT when there is no app under test to read', async () => {
    stubSource(undefined)

    expect(await exec()).to.deep.eq({
      error: { code: 'NO_AUT', message: 'no app under test is loaded — run a spec first' },
    })
  })

  // The stub queries for real: the rejection under test is the browser parser's,
  // and a stub that simply throws would prove nothing about it.
  it('fails with INVALID_SELECTOR when the browser rejects the selector', async () => {
    stubSource({
      find: (selector) => document.querySelectorAll(selector),
      getSelector: () => null,
    })

    expect(await exec('>>bad')).to.deep.eq({
      error: { code: 'INVALID_SELECTOR', message: '">>bad" is not a valid CSS selector' },
    })
  })

  it('fails with INVALID_ARGUMENTS when no selector is given', async () => {
    stubSource(sourceOf([], () => null))

    const outcome = await new TapManager(CYPRESS_VERSION).exec('resolve-selector')

    expect((outcome as { error: { code: string } }).error.code).to.eq('INVALID_ARGUMENTS')
  })
})
