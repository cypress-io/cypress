import { describe, it, expect } from 'vitest'
import { getSpanNames } from '../src/span-names'

describe('getSpanNames', () => {
  it('lists the spans in every resource and scope of a request', () => {
    const request = JSON.stringify({
      resourceSpans: [
        {
          resource: { attributes: [] },
          scopeSpans: [
            { scope: { name: 'cypress:app' }, spans: [{ name: 'app:mounted' }, { name: 'specs:list:first:render' }] },
          ],
        },
        {
          resource: { attributes: [] },
          scopeSpans: [{ scope: { name: 'cypress:launchpad' }, spans: [{ name: 'launchpad:mounted' }] }],
        },
      ],
    })

    expect(getSpanNames(request)).toEqual(['app:mounted', 'specs:list:first:render', 'launchpad:mounted'])
  })

  it('skips entries that are not spans with a name', () => {
    const request = JSON.stringify({
      resourceSpans: [
        null,
        { scopeSpans: 'not a list' },
        { scopeSpans: [null, { spans: [{ name: 1 }, {}, { name: 'app:mounted' }] }] },
      ],
    })

    expect(getSpanNames(request)).toEqual(['app:mounted'])
  })

  it('returns no names for a body that is not an OTLP request', () => {
    expect(getSpanNames('not json')).toEqual([])
    expect(getSpanNames('null')).toEqual([])
    expect(getSpanNames('{}')).toEqual([])
  })
})
