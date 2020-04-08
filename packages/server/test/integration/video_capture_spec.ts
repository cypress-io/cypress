const { expect, sinon } = require('../spec_helper')
import videoCapture from '../../lib/video_capture'
import path from 'path'
import fse from 'fs-extra'
import os from 'os'

describe('Video Capture', () => {
  context('#start', () => {
    let tmpFilename

    beforeEach(() => {
      tmpFilename = path.join(fse.mkdtempSync(path.join(os.tmpdir(), 'cy-video-')), 'video.mp4')
    })

    it('does not write anything on empty chunk', () => {
      return videoCapture.start(tmpFilename)
      .then(({ _pt, writeVideoFrame, endVideoCapture }) => {
        sinon.stub(_pt, 'write')

        writeVideoFrame({})

        expect(_pt.write).to.not.be.called

        return endVideoCapture().catchReturn(null)
      })
    })

    it('writes video frames to passthru stream', () => {
      return videoCapture.start(tmpFilename)
      .then(({ _pt, writeVideoFrame, endVideoCapture }) => {
        sinon.stub(_pt, 'write')

        writeVideoFrame('foo')

        expect(_pt.write).to.be.calledWith('foo')

        return endVideoCapture().catchReturn(null)
      })
    })
  })
})
