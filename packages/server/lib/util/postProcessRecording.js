/* eslint-disable no-console */
const chalk = require('chalk')
const human = require('human-interval')
const debug = require('debug')('cypress:server:postprocessrecording')

const videoCapture = require('../video_capture')
const terminal = require('./terminal')
const env = require('./env')
const humanTime = require('./human_time')

const { gray, formatPath, getWidth } = require('./run_utils')

async function postProcessRecording (name, cname, videoCompression, shouldUploadVideo, quiet, ffmpegChaptersConfig) {
  debug('ending the video recording %o', { name, videoCompression, shouldUploadVideo })

  // once this ended promises resolves
  // then begin processing the file
  // dont process anything if videoCompress is off
  // or we've been told not to upload the video
  if (videoCompression === false || shouldUploadVideo === false) {
    return
  }

  function continueProcessing (onProgress = undefined) {
    return videoCapture.process(name, cname, videoCompression, ffmpegChaptersConfig, onProgress)
  }

  if (quiet) {
    return continueProcessing()
  }

  console.log('')

  terminal.header('Video', {
    color: ['cyan'],
  })

  console.log('')

  const table = terminal.table({
    colWidths: [3, 21, 76],
    colAligns: ['left', 'left', 'left'],
    type: 'noBorder',
    style: {
      'padding-right': 0,
    },
    chars: {
      'left': ' ',
      'right': '',
    },
  })

  table.push([
    gray('-'),
    gray('Started processing:'),
    chalk.cyan(`Compressing to ${videoCompression} CRF`),
  ])

  console.log(table.toString())

  const started = Date.now()
  let progress = Date.now()
  const throttle = env.get('VIDEO_COMPRESSION_THROTTLE') || human('10 seconds')

  const onProgress = function (float) {
    if (float === 1) {
      const finished = Date.now() - started
      const dur = `(${humanTime.long(finished)})`

      const table = terminal.table({
        colWidths: [3, 21, 61, 15],
        colAligns: ['left', 'left', 'left', 'right'],
        type: 'noBorder',
        style: {
          'padding-right': 0,
        },
        chars: {
          'left': ' ',
          'right': '',
        },
      })

      table.push([
        gray('-'),
        gray('Finished processing:'),
        `${formatPath(name, getWidth(table, 2), 'cyan')}`,
        gray(dur),
      ])

      console.log(table.toString())

      console.log('')
    }

    if (Date.now() - progress > throttle) {
      // bump up the progress so we dont
      // continuously get notifications
      progress += throttle
      const percentage = `${Math.ceil(float * 100)}%`

      console.log('    Compression progress: ', chalk.cyan(percentage))
    }
  }

  return continueProcessing(onProgress)
}

module.exports = postProcessRecording
