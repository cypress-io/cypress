import { concatStream } from '@packages/network'
import fs from 'fs'
import stream from 'stream'
import { fileURLToPath } from 'url'
import { describe, expect, it, vi } from 'vitest'

import { streamBuffer } from '../../../lib/util/stream_buffer'

function drain (readable: stream.Readable): Promise<string> {
  return new Promise((resolve) => {
    readable.pipe(concatStream((buf: Buffer) => {
      resolve(buf.toString())
    }))
  })
}

describe('lib/util/stream_buffer', () => {
  it('reads out no matter when we write', () => {
    return new Promise<void>((resolve) => {
      let finished = 0
      const finishBoth = () => {
        finished++
        if (finished === 2) {
          resolve()
        }
      }

      const pt = new stream.PassThrough()
      const sb = streamBuffer()

      pt.pipe(sb as unknown as NodeJS.WritableStream)
      pt.write('1')
      pt.write(' 2')

      const tickWrite = (chunk: string) => {
        process.nextTick(() => {
          pt.write(chunk)
        })
      }

      const readable = sb.createReadStream()

      readable.once('data', (data2) => {
        expect(data2.toString()).toBe('1 2')

        tickWrite(' 3')

        readable.once('data', (data3) => {
          expect(data3.toString()).toBe(' 3')

          tickWrite(' 4')

          const readable2 = sb.createReadStream()

          readable.once('data', (data4) => {
            expect(data4.toString()).toBe(' 4')
          })

          readable2.once('data', (data) => {
            expect(data.toString()).toBe('1 2 3 4')

            tickWrite(' 5')

            readable2.once('data', (data5) => {
              expect(data5.toString()).toBe(' 5')

              finishBoth()
            })

            readable.once('data', (data5) => {
              expect(data5.toString()).toBe(' 5')

              finishBoth()
            })
          })
        })
      })
    })
  })

  it('on overflow, enlarges the internal buffer by the smallest power of 2 that can fit the chunk', async () => {
    const sb = streamBuffer(64)

    sb.write('A'.repeat(65))

    expect(sb._buffer()!.length).toBe(128)

    sb.end('A'.repeat(1024))

    expect(sb._buffer()!.length).toBe(2048)

    const readable = sb.createReadStream()
    const buf = await drain(readable)

    expect(buf).toBe('A'.repeat(1089))
  })

  it('finishes when buffer stream closes while still allowing data to be drained', () => {
    return new Promise<void>((resolve) => {
      const sb = streamBuffer()

      sb.write('foo')
      sb.write('bar')

      expect(sb._finished()).toBe(false)

      sb.end(() => {
        expect(sb._finished()).toBe(true)

        const readable = sb.createReadStream()

        void drain(readable)
        .then((buf) => {
          expect(buf).toBe('foobar')

          const readable2 = sb.createReadStream()

          return drain(readable2)
        })
        .then((buf2) => {
          expect(buf2).toBe('foobar')

          resolve()
        })
      })
    })
  })

  it('can be piped into and then read from', () => {
    return new Promise<void>((resolve) => {
      // @ts-expect-error Vitest bundles tests as ESM; package tsconfig uses `module: commonjs`
      const thisFile = fileURLToPath(import.meta.url)
      const expected = fs.readFileSync(thisFile, 'utf8')
      const rs = fs.createReadStream(thisFile)
      const sb = streamBuffer()

      rs.pipe(sb as unknown as NodeJS.WritableStream)

      const readable = sb.createReadStream()

      rs.on('end', () => {
        void drain(readable)
        .then((buf) => {
          expect(buf).toBe(expected)

          resolve()
        })
      })
    })
  })

  it('readable recursively pushes until it returns false', () => {
    return new Promise<void>((resolve) => {
      const sb = streamBuffer()
      const readable = sb.createReadStream()
      const size = 64 * 1024 // 64 kb
      const buf = Buffer.alloc(size, '!')

      const pushSpy = vi.spyOn(readable, 'push')

      const writeable = new stream.Writable({
        final () {
          expect(pushSpy).toHaveBeenCalledTimes(2)
          expect(pushSpy.mock.calls[0][0]).toEqual(buf)
          expect(pushSpy.mock.calls[1][0]).toBe(null)
          resolve()
        },
        write (_chunk, _enc, cb) {
          cb()
        },
      })

      readable.pipe(writeable)

      sb.end(buf)
    })
  })

  it('readable pipes do not end until the writeable ends', () => {
    return new Promise<void>((resolve) => {
      const sb = streamBuffer()
      const readable = sb.createReadStream()
      const writeable = new stream.Writable({
        final () {
          expect(sb.writable).toBe(false)
          expect((sb as unknown as { _writableState?: { ended?: boolean } })._writableState).toHaveProperty('ended', true)
          resolve()
        },
        write (_chunk, _enc, cb) {
          process.nextTick(() => {
            if (sb.writable) {
              sb.end('asdf')
            }
          })

          cb()
        },
      })

      readable.pipe(writeable)

      const size = 64 * 1024 // 64 kb
      const buf = Buffer.alloc(size, '!')

      sb.write(buf)
    })
  })

  it('can handle a massive req body', () => {
    return new Promise<void>((resolve) => {
      const size = 16 * 1024 // 16 kb
      const repeat = 3

      const body = Buffer.alloc(size, '!')
      const sb = streamBuffer()

      const pt = new stream.PassThrough({
        highWaterMark: Number.MAX_SAFE_INTEGER,
      })

      pt.pipe(sb as unknown as NodeJS.WritableStream, { end: true })

      pt.write(Buffer.alloc(size, '!'))
      pt.write(Buffer.alloc(size, '!'))
      pt.write(Buffer.alloc(size, '!'))

      pt.on('end', () => {
        const readable = sb.createReadStream()

        void drain(readable)
        .then((buf) => {
          expect(buf.length).toBe(body.length * repeat)

          expect(buf).toBe(body.toString().repeat(repeat))
          resolve()
        })
      })

      pt.end()
    })
  })

  it('silently discards writes after it has been destroyed, with no consumers', () => {
    return new Promise<void>((resolve) => {
      const sb = streamBuffer()

      sb.write('foo')
      sb.unpipeAll()
      sb.write('bar', () => resolve())
    })
  })

  it('silently discards writes after it has been destroyed, with a consumer', () => {
    return new Promise<void>((resolve) => {
      const sb = streamBuffer()
      const pt = new stream.PassThrough()

      sb.createReadStream().pipe(pt)

      sb.write('foo')
      sb.unpipeAll()
      sb.write('bar', () => resolve())
    })
  })
})
