import _ from 'lodash'
import utils from 'fluent-ffmpeg/lib/utils'
import Debug from 'debug'
import ffmpeg from 'fluent-ffmpeg'
import stream from 'stream'
import Bluebird from 'bluebird'
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg'
import BlackHoleStream from 'black-hole-stream'
import { fs } from './util/fs'

const debug = Debug('cypress:server:video')
// extra verbose logs for logging individual frames
const debugFrames = Debug('cypress-verbose:server:video:frames')

debug('using ffmpeg from %s', ffmpegPath)

ffmpeg.setFfmpegPath(ffmpegPath)

const deferredPromise = function () {
  let reject
  let resolve
  const promise = new Bluebird((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { promise, resolve, reject }
}

export function generateFfmpegChaptersConfig (tests) {
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
}

export function getMsFromDuration (duration) {
  return utils.timemarkToSeconds(duration) * 1000
}

export function getCodecData (src) {
  return new Bluebird((resolve, reject) => {
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
}

export function getChapters (fileName) {
  return new Bluebird((resolve, reject) => {
    ffmpeg.ffprobe(fileName, ['-show_chapters'], (err, metadata) => {
      if (err) {
        return reject(err)
      }

      resolve(metadata)
    })
  })
}

export function copy (src, dest) {
  debug('copying from %s to %s', src, dest)

  return fs
  .copy(src, dest, { overwrite: true })
  .catch((err) => {
    if (err.code === 'ENOENT') {
      debug('caught ENOENT error on copy, ignoring %o', { src, dest, err })

      return
    }

    throw err
  })
}

type StartOptions = {
  // If set, expect input frames as webm chunks.
  webmInput?: boolean
  // Callback for asynchronous errors in video processing/compression.
  onError?: (err: Error, stdout: string, stderr: string) => void
}

export function start (name, options: StartOptions = {}) {
  const pt = new stream.PassThrough()
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
      return new Bluebird((resolve) => {
        pt.once('data', resolve)
      })
      .then(() => endVideoCapture())
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

    if (options.webmInput) {
      if (lengths[data.length]) {
        // this prevents multiple chunks of webm metadata from being written to the stream
        // which would crash ffmpeg
        debugFrames('duplicate length frame received:', data.length)

        return
      }

      lengths[data.length] = true
    }

    writtenChunksCount++

    debugFrames('writing video frame')

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
    return new Bluebird((resolve) => {
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
        options.onError?.(err, stdout, stderr)

        // reject the ended promise
        return ended.reject(err)
      }).on('end', () => {
        debug('capture ended')

        return ended.resolve()
      })

      // this is to prevent the error "invalid data input" error
      // when input frames have an odd resolution
      .videoFilters(`crop='floor(in_w/2)*2:floor(in_h/2)*2'`)

      if (options.webmInput) {
        cmd
        .inputFormat('webm')

        // assume 18 fps. This number comes from manual measurement of avg fps coming from firefox.
        // TODO: replace this with the 'vfr' option below when dropped frames issue is fixed.
        .inputFPS(18)

        // 'vsync vfr' (variable framerate) works perfectly but fails on top page navigation
        // since video timestamp resets to 0, timestamps already written will be dropped
        // .outputOption('-vsync vfr')
      } else {
        cmd
        .inputFormat('image2pipe')
        .inputOptions('-use_wallclock_as_timestamps 1')
      }

      return cmd.save(name)
    })
  }

  return startCapturing()
  .then(({ cmd, startedVideoCapture }: any) => {
    return {
      _pt: pt,
      cmd,
      endVideoCapture,
      writeVideoFrame,
      startedVideoCapture,
    }
  })
}

// Progress callback called with percentage `0 <= p <= 1` of compression progress.
type OnProgress = (p: number) => void

export async function process (name, cname, videoCompression, ffmpegchaptersConfig, onProgress: OnProgress = function () {}) {
  let total = null

  const metaFileName = `${name}.meta`
  const addChaptersMeta = ffmpegchaptersConfig && await fs.writeFile(metaFileName, ffmpegchaptersConfig).then(() => true)

  return new Bluebird((resolve, reject) => {
    debug('processing video from %s to %s video compression %o',
      name, cname, videoCompression)

    const command = ffmpeg()
    .addOptions([
      // These flags all serve to reduce initial buffering, especially important
      // when dealing with very short videos (such as during component tests).
      // See https://ffmpeg.org/ffmpeg-formats.html#Format-Options for details.
      '-avioflags direct',

      // Because we're passing in a slideshow of still frames, there's no
      // fps metadata to be found in the video stream. This ensures that ffmpeg
      // isn't buffering a lot of data waiting for information that's not coming.
      '-fpsprobesize 0',

      // Tells ffmpeg to read only the first 32 bytes of the stream for information
      // (resolution, stream format, etc).
      // Some videos can have long metadata (eg, lots of chapters) or spread out,
      // but our streams are always predictable; No need to wait / buffer data before
      // starting encoding
      '-probesize 32',

      // By default ffmpeg buffers the first 5 seconds of video to analyze it before
      // it starts encoding. We're basically telling it "there is no metadata coming,
      // start encoding as soon as we give you frames."
      '-analyzeduration 0',
    ])

    // See https://trac.ffmpeg.org/wiki/Encode/H.264 for details about h264 options.
    const outputOptions = [
      // Preset is a tradeoff between encoding speed and filesize. It does not determine video
      // quality; It's just a tradeoff between CPU vs size.
      '-preset fast',
      // Compression Rate Factor is essentially the quality dial; 0 would be lossless
      // (big files), while 51 (the maximum) would lead to low quality (and small files).
      `-crf ${videoCompression}`,

      // Discussion of pixel formats is beyond the scope of these comments. See
      // https://en.wikipedia.org/wiki/Chroma_subsampling if you want the gritty details.
      // Short version: yuv420p is a standard video format supported everywhere.
      '-pix_fmt yuv420p',
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

      // @ts-ignore
      const percent = progressed / total

      if (percent < 1) {
        return onProgress(percent)
      }
    })
    .on('error', (err, stdout, stderr) => {
      debug('compression errored: %o', { error: err.message, stdout, stderr })

      return reject(err)
    })
    .on('end', async () => {
      debug('compression ended')

      // we are done progressing
      onProgress(1)

      // rename and obliterate the original
      await fs.move(cname, name, {
        overwrite: true,
      })

      if (addChaptersMeta) {
        await fs.unlink(metaFileName)
      }

      resolve()
    }).save(cname)
  })
}
