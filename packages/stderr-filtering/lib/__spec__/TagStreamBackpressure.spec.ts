import { describe, it, expect } from 'vitest'
import { Readable, Writable } from 'stream'
import { TagStream } from '../TagStream'

describe('TagStream backpressure', () => {
  it('keeps forwarding data when the downstream consumer is slower than the source', async () => {
    // a transform that waits on its own 'drain' event after push() returns
    // false deadlocks here: 'drain' cannot fire until the current transform
    // completes, so the stream parks and never forwards anything again
    const chunkSize = 4096
    const chunkCount = 24
    let produced = 0
    let forwarded = 0

    const source = new Readable({
      read () {
        if (produced >= chunkCount) return this.push(null)

        produced++

        this.push(Buffer.alloc(chunkSize, 0x61))
      },
    })

    const sink = new Writable({
      highWaterMark: 1024,
      write (chunk, _encoding, callback) {
        forwarded += chunk.length
        setTimeout(callback, 1)
      },
    })

    const finished = new Promise<boolean>((resolve, reject) => {
      source.on('error', reject)
      sink.on('error', reject)
      sink.on('finish', () => resolve(true))
    })

    source.pipe(new TagStream()).pipe(sink)

    // when the transform parks, the sink never finishes
    const stalled = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000))

    expect(await Promise.race([finished, stalled])).toBe(true)
    expect(produced).toBe(chunkCount)
    expect(forwarded).toBeGreaterThanOrEqual(chunkCount * chunkSize)
  })
})
