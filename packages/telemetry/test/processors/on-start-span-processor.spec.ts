import { describe, it, expect } from 'vitest'
import { OnStartSpanProcessor } from '../../src/processors/on-start-span-processor'

describe('on-start-span-processor', () => {
  it('calls onEnd on start', async () => {
    const processor = new OnStartSpanProcessor(undefined)

    const span = 'span'

    const promise = new Promise((resolve) => {
      processor.onEnd = (span) => {
        expect(span).toEqual('span')
        resolve()
      }
    })

    // @ts-expect-error
    processor.onStart(span, undefined)

    await promise
  })
})
