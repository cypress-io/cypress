import { expect } from 'chai'
import path from 'path'
import os from 'os'
import { fs } from '../../lib/util/fs'
import * as videoCapture from '../../lib/video_capture'

// a 2x2 png, the smallest frame the capture's crop filter accepts
const FRAME = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAABAAAAAQBPJcTWAAAAEElEQVR4nGP4y8AARAwQCgAfrgP19hgqWQAAAABJRU5ErkJggg==', 'base64')

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('lib/video_capture', () => {
  context('.start', () => {
    let videoName: string

    beforeEach(async () => {
      videoName = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'cy-video-')), 'out.mp4')
    })

    afterEach(() => {
      return fs.remove(path.dirname(videoName))
    })

    // the browser takes seconds to launch and paint before it hands over a first frame,
    // so anchoring to the spawn time would push every chapter marker that much later
    // than the test it marks
    it('starts the timeline at the first frame rather than at the ffmpeg process', async () => {
      const { writeVideoFrame, endVideoCapture, getVideoStartedAt } = await videoCapture.start({ videoName })
      const spawnedAt = Date.now()

      await delay(500)

      writeVideoFrame(FRAME)
      const firstFrameAt = Date.now()

      writeVideoFrame(FRAME)

      await endVideoCapture()

      expect(getVideoStartedAt().getTime()).to.be.closeTo(firstFrameAt, 100)
      expect(getVideoStartedAt().getTime() - spawnedAt).to.be.greaterThan(400)
    })

    it('falls back to the ffmpeg process when no frame is ever captured', async () => {
      const { endVideoCapture, getVideoStartedAt } = await videoCapture.start({ videoName })
      const spawnedAt = Date.now()

      await endVideoCapture(false).catch(() => {})

      expect(getVideoStartedAt().getTime()).to.be.closeTo(spawnedAt, 1000)
    })
  })
})
