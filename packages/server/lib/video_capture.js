const _ = require('lodash')
const utils = require('fluent-ffmpeg/lib/utils')
const debug = require('debug')('cypress:server:video')
const ffmpeg = require('fluent-ffmpeg')
const stream = require('stream')
const Promise = require('bluebird')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const BlackHoleStream = require('black-hole-stream')
const fs = require('./util/fs')

// extra verbose logs for logging individual frames
const debugFrames = require('debug')('cypress-verbose:server:video:frames')

debug('using ffmpeg from %s', ffmpegPath)

ffmpeg.setFfmpegPath(ffmpegPath)

const deferredPromise = function () {
  let reject
  let resolve = (reject = null)
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { promise, resolve, reject }
}

module.exports = {
  generateFfmpegChaptersConfig (tests) {
    if (!tests) {
      return null
    }

    const configString = tests.map((test) => {
      return test.attempts.map((attempt, i) => {
        const { videoTimestamp, wallClockDuration } = attempt
        let title = test.title ? test.title.join(' ') : ''

        if (i > 0) {
          title += `attempt ${i}`
        }

        return [
          '[CHAPTER]',
          'TIMEBASE=1/1000',
          `START=${videoTimestamp - wallClockDuration}`,
          `END=${videoTimestamp}`,
          `title=${title}`,
        ].join('\n')
      }).join('\n')
    }).join('\n')

    return `;FFMETADATA1\n${configString}`
  },

  getMsFromDuration (duration) {
    return utils.timemarkToSeconds(duration) * 1000
  },

  getCodecData (src) {
    return new Promise((resolve, reject) => {
      return ffmpeg()
      .on('stderr', (stderr) => {
        return debug('get codecData stderr log %o', { message: stderr })
      }).on('codecData', resolve)
      .input(src)
      .format('null')
      .output(new BlackHoleStream())
      .run()
    }).tap((data) => {
      return debug('codecData %o', {
        src,
        data,
      })
    }).tapCatch((err) => {
      return debug('getting codecData failed', { err })
    })
  },

  getChapters (fileName) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(fileName, ['-show_chapters'], (err, metadata) => {
        if (err) {
          return reject(err)
        }

        resolve(metadata)
      })
    })
  },

  copy (src, dest) {
    debug('copying from %s to %s', src, dest)

    return fs
    .copyAsync(src, dest, { overwrite: true })
    .catch({ code: 'ENOENT' }, () => {})
  },
  // dont yell about ENOENT errors

  start (name, options = {}) {
    const pt = stream.PassThrough()
    const ended = deferredPromise()
    let done = false
    let wantsWrite = true
    let skippedChunksCount = 0
    let writtenChunksCount = 0

    _.defaults(options, {
      onError () {},
    })

    const endVideoCapture = function (waitForMoreChunksTimeout = 3000) {
      debugFrames('frames written:', writtenChunksCount)

      // in some cases (webm) ffmpeg will crash if fewer than 2 buffers are
      // written to the stream, so we don't end capture until we get at least 2
      if (writtenChunksCount < 2) {
        return new Promise((resolve) => {
          pt.once('data', resolve)
        })
        .then(endVideoCapture)
        .timeout(waitForMoreChunksTimeout)
      }

      done = true

      pt.end()

      // return the ended promise which will eventually
      // get resolve or rejected
      return ended.promise
    }

    const lengths = {}

    const writeVideoFrame = function (data) {
      // make sure we haven't ended
      // our stream yet because paint
      // events can linger beyond
      // finishing the actual video
      if (done) {
        return
      }

      // when `data` is empty, it is sent as an empty Buffer (`<Buffer >`)
      // which can crash the process. this can happen if there are
      // errors in the video capture process, which are handled later
      // on, so just skip empty frames here.
      // @see https://github.com/cypress-io/cypress/pull/6818
      if (_.isEmpty(data)) {
        debugFrames('empty chunk received %o', data)

        return
      }

      if (lengths[data.length]) {
        // this prevents multiple chunks of webm metadata from being written to the stream
        // which would crash ffmpeg
        debugFrames('duplicate length frame received:', data.length)

        return
      }

      writtenChunksCount++

      debugFrames('writing video frame')
      lengths[data.length] = true

      if (wantsWrite) {
        if (!(wantsWrite = pt.write(data))) {
          return pt.once('drain', () => {
            debugFrames('video stream drained')

            wantsWrite = true
          })
        }
      } else {
        skippedChunksCount += 1

        return debugFrames('skipping video frame %o', { skipped: skippedChunksCount })
      }
    }

    const startCapturing = () => {
      return new Promise((resolve) => {
        const cmd = ffmpeg({
          source: pt,
          priority: 20,
        })
        .videoCodec('libx264')
        .outputOptions('-preset ultrafast')
        .on('start', (command) => {
          debug('capture started %o', { command })

          return resolve({
            cmd,
            startedVideoCapture: new Date,
          })
        }).on('codecData', (data) => {
          return debug('capture codec data: %o', data)
        }).on('stderr', (stderr) => {
          return debug('capture stderr log %o', { message: stderr })
        }).on('error', (err, stdout, stderr) => {
          debug('capture errored: %o', { error: err.message, stdout, stderr })

          // bubble errors up
          options.onError(err, stdout, stderr)

          // reject the ended promise
          return ended.reject(err)
        }).on('end', () => {
          debug('capture ended')

          return ended.resolve()
        })

        if (options.webmInput) {
          cmd
          .inputFormat('webm')

          // assume 18 fps. This number comes from manual measurement of avg fps coming from firefox.
          // TODO: replace this with the 'vfr' option below when dropped frames issue is fixed.
          .inputFPS(18)

          // 'vsync vfr' (variable framerate) works perfectly but fails on top page navigation
          // since video timestamp resets to 0, timestamps already written will be dropped
          // .outputOption('-vsync vfr')

          // this is to prevent the error "invalid data input" error
          // when input frames have an odd resolution
          .videoFilters(`crop='floor(in_w/2)*2:floor(in_h/2)*2'`)

          // same as above but scales instead of crops
          // .videoFilters("scale=trunc(iw/2)*2:trunc(ih/2)*2")
        } else {
          cmd
          .inputFormat('image2pipe')
          .inputOptions('-use_wallclock_as_timestamps 1')
        }

        return cmd.save(name)
      })
    }

    return startCapturing()
    .then(({ cmd, startedVideoCapture }) => {
      return {
        _pt: pt,
        cmd,
        endVideoCapture,
        writeVideoFrame,
        startedVideoCapture,
      }
    })
  },

  async process (name, cname, videoCompression, ffmpegchaptersConfig, onProgress = function () {}) {
    const metaFileName = `${name}.meta`

    const maybeGenerateMetaFile = Promise.method(() => {
      if (!ffmpegchaptersConfig) {
        return false
      }

      // Writing the metadata to filesystem is necessary because fluent-ffmpeg is just a wrapper of ffmpeg command.
      return fs.writeFile(metaFileName, ffmpegchaptersConfig).then(() => true)
    })

    const addChaptersMeta = await maybeGenerateMetaFile()

    let total = null

    return new Promise((resolve, reject) => {
      debug('processing video from %s to %s video compression %o',
        name, cname, videoCompression)

      const command = ffmpeg()
      const outputOptions = [
        '-preset fast',
        `-crf ${videoCompression}`,
      ]

      if (addChaptersMeta) {
        command.input(metaFileName)
        outputOptions.push('-map_metadata 1')
      }

      command.input(name)
      .videoCodec('libx264')
      .outputOptions(outputOptions)
      // .videoFilters("crop='floor(in_w/2)*2:floor(in_h/2)*2'")
      .on('start', (command) => {
        debug('compression started %o', { command })
      })
      .on('codecData', (data) => {
        debug('compression codec data: %o', data)

        total = utils.timemarkToSeconds(data.duration)
      })
      .on('stderr', (stderr) => {
        debug('compression stderr log %o', { message: stderr })
      })
      .on('progress', (progress) => {
        // bail if we dont have total yet
        if (!total) {
          return
        }

        debug('compression progress: %o', progress)

        const progressed = utils.timemarkToSeconds(progress.timemark)

        const percent = progressed / total

        if (percent < 1) {
          return onProgress(percent)
        }
      })
      .on('error', (err, stdout, stderr) => {
        debug('compression errored: %o', { error: err.message, stdout, stderr })

        return reject(err)
      })
      .on('end', () => {
        debug('compression ended')

        // we are done progressing
        onProgress(1)

        // rename and obliterate the original
        return fs.moveAsync(cname, name, {
          overwrite: true,
        })
        .then(() => {
          if (addChaptersMeta) {
            return fs.unlink(metaFileName)
          }
        })
        .then(() => {
          return resolve()
        })
      }).save(cname)
    })
  },

}
