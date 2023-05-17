import { expect } from 'chai'

import { OnStartSpanProcessor } from '../../src/processors/on-start-span-processor'

describe('on-start-span-processor', () => {
  it('calls onEnd on start', (done) => {
    const processor = new OnStartSpanProcessor(undefined)

    const span = 'span'

    processor.onEnd = (span) => {
      expect(span).to.equal
      done()
    }

    //@ts-expect-error
    processor.onStart(span, undefined)
  })
})
