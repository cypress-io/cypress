const { expect, sinon } = require('../spec_helper')
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

  sinon.spy(props._pt, 'write')

  function writeVideoFrameAsBuffer (data) {
    const buf = Buffer.from(data)

    props.writeVideoFrame(buf)

    return buf
  }

  return {
    ...props,
    writeVideoFrameAsBuffer,
    END_OF_FILE_ERROR,
  }
}

describe('Video Capture', () => {
  context('#start.writeVideoFrame', () => {
    let tmpFilename

    beforeEach(() => {
      tmpFilename = path.join(fse.mkdtempSync(path.join(os.tmpdir(), 'cy-video-')), 'video.mp4')
    })

    it('writes video frames to passthru stream', async () => {
      const { _pt, writeVideoFrameAsBuffer, endVideoCapture, END_OF_FILE_ERROR } = await startSpiedVideoCapture(tmpFilename)

      const [buf] = [
        writeVideoFrameAsBuffer('foo'),
        writeVideoFrameAsBuffer('foobar'),
      ]

      expect(_pt.write).calledWith(buf)

      await expect(endVideoCapture()).rejectedWith(END_OF_FILE_ERROR)
    })

    it('does not write anything on empty chunk', async () => {
      const { _pt, writeVideoFrameAsBuffer, endVideoCapture, END_OF_FILE_ERROR } = await startSpiedVideoCapture(tmpFilename)

      const [, buf2] = [
        writeVideoFrameAsBuffer('foo'),
        writeVideoFrameAsBuffer('foobar'),
        writeVideoFrameAsBuffer(''),
      ]

      // @ts-ignore
      expect(_pt.write.lastCall).calledWith(buf2)

      await expect(endVideoCapture()).rejectedWith(END_OF_FILE_ERROR)
    })

    // https://github.com/cypress-io/cypress/issues/16648
    context('deduping frames', async () => {
      it('does not dedupe when not webminput', async () => {
        const { writeVideoFrameAsBuffer, _pt } = await startSpiedVideoCapture(tmpFilename)

        writeVideoFrameAsBuffer('foo')
        writeVideoFrameAsBuffer('foo')
        writeVideoFrameAsBuffer('foo')
        writeVideoFrameAsBuffer('foo')
        expect(_pt.write).callCount(4)
      })
    })

    it('does dedupe when webminput', async () => {
      const { writeVideoFrameAsBuffer, _pt } = await startSpiedVideoCapture(tmpFilename, { webmInput: true })

      writeVideoFrameAsBuffer('foo')
      writeVideoFrameAsBuffer('foo')
      writeVideoFrameAsBuffer('foo')
      writeVideoFrameAsBuffer('foo')
      expect(_pt.write).calledOnce
    })
  })

  context('#start.endVideoCapture', () => {
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
