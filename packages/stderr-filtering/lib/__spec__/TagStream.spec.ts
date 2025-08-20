import { describe, it, expect, vi, MockedObject } from 'vitest'
import { TagStream } from '../TagStream'
import { START_TAG, END_TAG } from '../constants'
import { StringDecoder } from 'string_decoder'

vi.mock('stream')
vi.mock('string_decoder')

describe('TagStream', () => {
  let mockStringDecoder: MockedObject<StringDecoder>
  let tagStream: TagStream
  const strInput = 'Hello, world!'

  beforeEach(() => {
    vi.clearAllMocks()
    mockStringDecoder = {
      write: vi.fn(),
      end: vi.fn(),
    }

    vi.mocked(StringDecoder).mockImplementation(() => mockStringDecoder)
    tagStream = new TagStream()
    vi.spyOn(tagStream, 'push').mockImplementation(() => true)
  })

  describe('when transforming a string', () => {
    it('passes on the string wrapped in the start and end tags', async () => {
      const cb = vi.fn()

      await tagStream.transform(strInput, 'utf-8', cb)
      expect(tagStream.push).toHaveBeenCalledWith(Buffer.from(`${START_TAG}${strInput}${END_TAG}`))
      expect(cb).toHaveBeenCalled()
    })

    it('flushes the stream', async () => {
      const cb = vi.fn()

      mockStringDecoder.end.mockReturnValue(strInput)
      await tagStream.flush(cb)
      expect(cb).toHaveBeenCalledWith(undefined, Buffer.from(`${START_TAG}${strInput}${END_TAG}`))
    })
  })

  describe('when the downstream stream is not ready', () => {
    beforeEach(() => {
      vi.mocked(tagStream.push).mockClear()
      vi.spyOn(tagStream, 'once').mockImplementation((ev, cb) => {
        if (ev === 'drain') {
          cb()
        }

        return tagStream
      })
    })

    it('waits for the stream to be ready', async () => {
      const cb = vi.fn()

      vi.mocked(tagStream.push).mockReturnValue(false)

      const promise = tagStream.transform(strInput, 'utf-8', cb)

      await promise

      expect(tagStream.once).toHaveBeenCalledWith('drain', expect.any(Function))
      expect(cb).toHaveBeenCalled()
    })
  })

  describe('when transforming a buffer', () => {
    const bufInput = Buffer.from(strInput)

    describe('and writing to the string decoder returns a string', () => {
      beforeEach(() => {
        mockStringDecoder.write.mockReturnValue(strInput)
      })

      it('passes on a buffer of the tagged output', async () => {
        const cb = vi.fn()

        await tagStream.transform(bufInput, 'buffer', cb)
        expect(tagStream.push).toHaveBeenCalledWith(Buffer.from(`${START_TAG}${strInput}${END_TAG}`))
        expect(cb).toHaveBeenCalled()
      })
    })

    describe('and writing to the string decoder returns nothing', () => {
      beforeEach(() => {
        mockStringDecoder.write.mockReturnValue('')
      })

      it('passes nothing on to the callback', async () => {
        const cb = vi.fn()

        await tagStream.transform(bufInput, 'buffer', cb)
        expect(tagStream.push).toHaveBeenCalledWith('')
        expect(cb).toHaveBeenCalled()
      })
    })

    describe('when str decoder throws an error', () => {
      const err = new Error('test')

      it('passes the error on to the callback', async () => {
        expect.assertions(1)

        const cb = vi.fn()

        mockStringDecoder.write.mockImplementation(() => {
          throw err
        })

        await tagStream.transform(bufInput, 'buffer', cb)
        expect(cb).toHaveBeenCalledWith(err)
      })
    })
  })
})
