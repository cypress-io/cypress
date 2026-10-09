import { describe, it, expect } from 'vitest'
import { generateFfmpegChaptersConfig } from '../../lib/video_capture'

const attempt = (videoTimestamp: number | null, wallClockDuration: number | null) => {
  return { videoTimestamp, wallClockDuration }
}

describe('lib/video_capture', () => {
  describe('.generateFfmpegChaptersConfig', () => {
    it('spans each chapter from the test start to the test end', () => {
      const config = generateFfmpegChaptersConfig([
        { title: ['suite', 'first'], attempts: [attempt(1000, 2000)] },
        { title: ['suite', 'second'], attempts: [attempt(3100, 500)] },
      ])

      expect(config).toStrictEqual([
        ';FFMETADATA1',
        '[CHAPTER]',
        'TIMEBASE=1/1000',
        'START=1000',
        'END=3000',
        'title=suite first',
        '[CHAPTER]',
        'TIMEBASE=1/1000',
        'START=3100',
        'END=3600',
        'title=suite second',
      ].join('\n'))
    })

    it('omits pending tests', () => {
      const config = generateFfmpegChaptersConfig([
        { title: ['ran'], attempts: [attempt(1000, 2000)] },
        { title: ['pending'], attempts: [attempt(null, null)] },
      ])

      expect(config).toStrictEqual([
        ';FFMETADATA1',
        '[CHAPTER]',
        'TIMEBASE=1/1000',
        'START=1000',
        'END=3000',
        'title=ran',
      ].join('\n'))
    })
  })
})
