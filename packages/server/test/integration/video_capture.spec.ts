import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as videoCapture from '../../lib/video_capture'
import path from 'path'
import fse from 'fs-extra'
import os from 'os'

const image1Path = path.join(__dirname, '..', '..', '..', 'icons', 'assets', 'cypress.iconset', 'icon_16x16.png')
const image2Path = path.join(__dirname, '..', '..', '..', 'icons', 'assets', 'cypress.iconset', 'icon_32x32.png')
const image3Path = path.join(__dirname, '..', '..', '..', 'icons', 'assets', 'cypress.iconset', 'icon_128x128.png')

async function startSpiedVideoCapture (videoName, options = {}) {
  const props = await videoCapture.start({ videoName, ...options })

  const END_OF_FILE_ERROR = `ffmpeg exited with code 1: Output #0, mp4, to '${videoName}':
Output file #0 does not contain any stream\n`

  const write = vi.spyOn(props._pt, 'write')

  function writeVideoFrameAsBuffer (data) {
    const buf = Buffer.from(data)

    props.writeVideoFrame(buf)

    return buf
  }

  return {
    ...props,
    write,
    writeVideoFrameAsBuffer,
    END_OF_FILE_ERROR,
  }
}

describe('Video Capture', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#start.writeVideoFrame', () => {
    let tmpFilename

    beforeEach(() => {
      tmpFilename = path.join(fse.mkdtempSync(path.join(os.tmpdir(), 'cy-video-')), 'video.mp4')
    })

    it('writes video frames to passthru stream', async () => {
      const { write, writeVideoFrameAsBuffer, endVideoCapture, END_OF_FILE_ERROR } = await startSpiedVideoCapture(tmpFilename)

      const [buf] = [
        writeVideoFrameAsBuffer('foo'),
        writeVideoFrameAsBuffer('foobar'),
      ]

      expect(write).toHaveBeenCalledWith(buf)

      await expect(endVideoCapture()).rejects.toThrow(END_OF_FILE_ERROR)
    })

    it('does not write anything on empty chunk', async () => {
      const { write, writeVideoFrameAsBuffer, endVideoCapture, END_OF_FILE_ERROR } = await startSpiedVideoCapture(tmpFilename)

      const [, buf2] = [
        writeVideoFrameAsBuffer('foo'),
        writeVideoFrameAsBuffer('foobar'),
        writeVideoFrameAsBuffer(''),
      ]

      expect(write).toHaveBeenLastCalledWith(buf2)

      await expect(endVideoCapture()).rejects.toThrow(END_OF_FILE_ERROR)
    })

    // https://github.com/cypress-io/cypress/issues/16648
    describe('deduping frames', () => {
      it('does not dedupe when not webminput', async () => {
        const { writeVideoFrameAsBuffer, write } = await startSpiedVideoCapture(tmpFilename)

        writeVideoFrameAsBuffer('foo')
        writeVideoFrameAsBuffer('foo')
        writeVideoFrameAsBuffer('foo')
        writeVideoFrameAsBuffer('foo')
        expect(write).toHaveBeenCalledTimes(4)
      })
    })

    it('does dedupe when webminput', async () => {
      const { writeVideoFrameAsBuffer, write } = await startSpiedVideoCapture(tmpFilename, { webmInput: true })

      writeVideoFrameAsBuffer('foo')
      writeVideoFrameAsBuffer('foo')
      writeVideoFrameAsBuffer('foo')
      writeVideoFrameAsBuffer('foo')
      expect(write).toHaveBeenCalledTimes(1)
    })
  })

  describe('#start.startedVideoCapture', () => {
    let tmpFilename

    beforeEach(() => {
      tmpFilename = path.join(fse.mkdtempSync(path.join(os.tmpdir(), 'cy-video-')), 'video.mp4')
    })

    it('is the time the first frame was written, not when ffmpeg started', async () => {
      const controller = await videoCapture.start({ videoName: tmpFilename })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const beforeFirstFrame = Date.now()

      controller.writeVideoFrame(fse.readFileSync(image1Path))

      expect(controller.startedVideoCapture.getTime()).toBeGreaterThanOrEqual(beforeFirstFrame)

      await controller.endVideoCapture(false)
    })

    it('is not changed by subsequent frames', async () => {
      const controller = await videoCapture.start({ videoName: tmpFilename })

      controller.writeVideoFrame(fse.readFileSync(image1Path))

      const firstFrameAt = controller.startedVideoCapture

      await new Promise((resolve) => setTimeout(resolve, 50))

      controller.writeVideoFrame(fse.readFileSync(image2Path))
      controller.writeVideoFrame(fse.readFileSync(image3Path))

      expect(controller.startedVideoCapture).toBe(firstFrameAt)

      await controller.endVideoCapture(false)
    })
  })

  describe('#start.endVideoCapture', () => {
    let tmpFilename

    beforeEach(() => {
      tmpFilename = path.join(fse.mkdtempSync(path.join(os.tmpdir(), 'cy-video-')), 'video.mp4')
    })

    it('ends immediately if more than two frames written', async () => {
      const { writeVideoFrame, endVideoCapture } = await startSpiedVideoCapture(tmpFilename)

      writeVideoFrame(fse.readFileSync(image1Path))
      writeVideoFrame(fse.readFileSync(image2Path))
      writeVideoFrame(fse.readFileSync(image3Path))

      const waitForMoreFrames = false

      await endVideoCapture(waitForMoreFrames)
    })

    // https://github.com/cypress-io/cypress/issues/6408
    it('waits for at least 2 stream writes before ending if spec not skipped by the cloud', async () => {
      const { writeVideoFrame, endVideoCapture } = await startSpiedVideoCapture(tmpFilename)

      writeVideoFrame(fse.readFileSync(image1Path))

      const waitForMoreFrames = true
      const endVideoCaptureResult = endVideoCapture(waitForMoreFrames)

      writeVideoFrame(fse.readFileSync(image2Path))

      await endVideoCaptureResult
    })

    it('ends immediately if less than two frames have been written and spec is skipped by the cloud', async () => {
      const { writeVideoFrame, endVideoCapture } = await startSpiedVideoCapture(tmpFilename)

      writeVideoFrame(fse.readFileSync(image1Path))
      const waitForMoreFrames = false

      await endVideoCapture(waitForMoreFrames)
    })
  })
})
