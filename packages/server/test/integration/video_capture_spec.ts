const { expect, sinon } = require('../spec_helper')
import videoCapture from '../../lib/video_capture'
import path from 'path'
import fse from 'fs-extra'
import os from 'os'

async function startSpiedVideoCapture (filename) {
  const props = await videoCapture.start(filename)

  const END_OF_FILE_ERROR = `ffmpeg exited with code 1: Output #0, mp4, to '${filename}':
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
  context('#start', () => {
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

      expect(_pt.write.lastCall).calledWith(buf2)

      await expect(endVideoCapture()).rejectedWith(END_OF_FILE_ERROR)
    })

    it('will eventually timeout on single frame write', async () => {
      const { writeVideoFrameAsBuffer, endVideoCapture } = await startSpiedVideoCapture(tmpFilename)

      writeVideoFrameAsBuffer('foo')

      await expect(endVideoCapture(1)).be.rejectedWith('operation timed out')
    })

    // https://github.com/cypress-io/cypress/issues/6408
    it('waits for at least 2 stream writes before ending', async () => {
      const { writeVideoFrameAsBuffer, endVideoCapture, END_OF_FILE_ERROR } = await startSpiedVideoCapture(tmpFilename)

      writeVideoFrameAsBuffer('foo')

      const endVideoCaptureResult = endVideoCapture()

      writeVideoFrameAsBuffer('foobar')

      await expect(endVideoCaptureResult).rejectedWith(END_OF_FILE_ERROR)
    })
  })
})
