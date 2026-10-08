import { describe, expect, it, vi } from 'vitest'
import _ from 'lodash'
import fs from 'fs'
import stream from 'stream'
import { concatStream } from '@packages/network'
import { streamBuffer } from '../../../lib/util/stream_buffer'

function drain (readable: NodeJS.ReadableStream): Promise<string> {
  return new Promise<string>((resolve) => {
    return readable.pipe(concatStream((buf) => {
      resolve(buf.toString())
    }))
  })
}

function withDone (fn: (done: (err?: unknown) => void) => void) {
  return () => {
    return new Promise<void>((resolve, reject) => {
      fn((err) => err ? reject(err) : resolve())
    })
  }
}

describe('lib/util/stream_buffer', () => {
  it('reads out no matter when we write', withDone((done) => {
    done = _.after(2, done)
    const pt = new stream.PassThrough()
    const sb = streamBuffer()

    pt.pipe(sb)
    pt.write('1')
    pt.write(' 2')

    const tickWrite = (chunk) => {
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

            done()
          })

          readable.once('data', (data5) => {
            expect(data5.toString()).toBe(' 5')

            done()
          })
        })
      })
    })
  }))

  it('on overflow, enlarges the internal buffer by the smallest power of 2 that can fit the chunk', () => {
    const sb = streamBuffer(64)

    sb.write('A'.repeat(65))

    expect(sb._buffer().length).toBe(128)

    sb.end('A'.repeat(1024))

    expect(sb._buffer().length).toBe(2048)

    const readable = sb.createReadStream()

    return drain(readable)
    .then((buf) => {
      expect(buf).toBe('A'.repeat(1089))
    })
  })

  it('finishes when buffer stream closes while still allowing data to be drained', withDone((done) => {
    const sb = streamBuffer()

    sb.write('foo')
    sb.write('bar')

    expect(sb._finished()).toBe(false)

    sb.end(() => {
      expect(sb._finished()).toBe(true)

      const readable = sb.createReadStream()

      return drain(readable)
      .then((buf) => {
        expect(buf).toBe('foobar')

        const readable2 = sb.createReadStream()

        return drain(readable2)
        .then((buf2) => {
          expect(buf2).toBe('foobar')

          done()
        })
      })
    })
  }))

  it('can be piped into and then read from', withDone((done) => {
    const expected = fs.readFileSync(__filename).toString()
    const rs = fs.createReadStream(__filename)
    const sb = streamBuffer()

    rs.pipe(sb)

    const readable = sb.createReadStream()

    rs.on('end', () => {
      return drain(readable)
      .then((buf) => {
        expect(buf).toBe(expected)

        done()
      })
    })
  }))

  it('readable recursively pushes until it returns false', withDone((done) => {
    const sb = streamBuffer()
    const readable = sb.createReadStream()
    const writeable = new stream.Writable({
      final () {
        expect(push).toHaveBeenCalledTimes(2)
        expect(push.mock.calls[0][0]).toStrictEqual(buf)
        expect(push.mock.calls[1][0]).toBeNull()
        done()
      },
      write (chunk, enc, cb) {
        cb()
      },
    })

    const push = vi.spyOn(readable, 'push')

    readable.pipe(writeable)

    const size = 64 * 1024 // 64 kb
    const buf = Buffer.alloc(size, '!')

    sb.end(buf)
  }))

  it('readable pipes do not end until the writeable ends', withDone((done) => {
    const sb = streamBuffer()
    const readable = sb.createReadStream()
    const writeable = new stream.Writable({
      final () {
        expect(sb.writable).toBe(false)
        expect((sb as any)._writableState).toHaveProperty('ended', true)
        done()
      },
      write (chunk, enc, cb) {
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
  }))

  it('can handle a massive req body', withDone((done) => {
    const size = 16 * 1024 // 16 kb
    const repeat = 3

    const body = Buffer.alloc(size, '!')
    const sb = streamBuffer()

    const pt = new stream.PassThrough({
      highWaterMark: Number.MAX_SAFE_INTEGER,
    })

    pt.pipe(sb, { end: true })

    pt.write(Buffer.alloc(size, '!'))
    pt.write(Buffer.alloc(size, '!'))
    pt.write(Buffer.alloc(size, '!'))

    pt.on('end', () => {
      const readable = sb.createReadStream()

      drain(readable)
      .then((buf) => {
        expect(buf.length).toBe(body.length * repeat)

        expect(buf).toBe(body.toString().repeat(repeat))
        done()
      })
    })

    pt.end()
  }))

  it('silently discards writes after it has been destroyed, with no consumers', withDone((done) => {
    const sb = streamBuffer()

    sb.write('foo')
    sb.unpipeAll()
    sb.write('bar', done)
  }))

  it('silently discards writes after it has been destroyed, with a consumer', withDone((done) => {
    const sb = streamBuffer()
    const pt = new stream.PassThrough()

    sb.createReadStream().pipe(pt)

    sb.write('foo')
    sb.unpipeAll()
    sb.write('bar', done)
  }))
})
