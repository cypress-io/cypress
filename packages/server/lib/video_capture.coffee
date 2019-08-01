_          = require("lodash")
utils      = require("fluent-ffmpeg/lib/utils")
debug      = require("debug")("cypress:server:video")
# extra verbose logs for logging individual frames
debugFrames = require("debug")("cypress:server:video:frames")
ffmpeg     = require("fluent-ffmpeg")
stream     = require("stream")
Promise    = require("bluebird")
ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
fs         = require("./util/fs")

debug("using ffmpeg from %s", ffmpegPath)
ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  copy: (src, dest) ->
    debug("copying from %s to %s", src, dest)
    fs
    .copyAsync(src, dest, {overwrite: true})
    .catch {code: "ENOENT"}, ->
      ## dont yell about ENOENT errors

  start: (name, options = {}) ->
    pt         = stream.PassThrough()
    ended      = Promise.pending()
    done       = false
    errored    = false
    written    = false
    logErrors  = true
    wantsWrite = true
    skipped    = 0

    _.defaults(options, {
      onError: ->
    })

    endVideoCapture = ->
      done = true

      if not written
        ## when no data has been written this will
        ## result in an 'pipe:0: End of file' error
        ## for so we need to account for that
        ## and not log errors to the console
        logErrors = false

      pt.end()

      ## return the ended promise which will eventually
      ## get resolve or rejected
      return ended.promise

    writeVideoFrame = (data) ->
      ## make sure we haven't ended
      ## our stream yet because paint
      ## events can linger beyond
      ## finishing the actual video
      return if done

      ## we have written at least 1 byte
      written = true

      debugFrames("writing video frame")

      if wantsWrite
        if not wantsWrite = pt.write(data)
          pt.once "drain", ->
            debugFrames("video stream drained")
      
            wantsWrite = true
      else
        skipped += 1

        debugFrames("skipping video frame %o", { skipped })

    startCapturing = ->
      new Promise (resolve) ->
        cmd = ffmpeg({
          source: pt
          priority: 20
        })
        .inputFormat("image2pipe")
        .inputOptions("-use_wallclock_as_timestamps 1")
        .videoCodec("libx264")
        .outputOptions("-preset ultrafast")
        .on "start", (command) ->
          debug("capture started %o", { command })

          resolve({
            cmd
            startedVideoCapture: new Date,
          })

        .on "codecData", (data) ->
          debug("capture codec data: %o", data)

        .on "stderr", (stderr) ->
          debug("capture stderr log %o", { message: stderr })

        .on "error", (err, stdout, stderr) ->
          debug("capture errored: %o", { error: err.message, stdout, stderr })

          ## if we're supposed log errors then
          ## bubble them up
          if logErrors
            options.onError(err, stdout, stderr)

          err.recordingVideoFailed = true

          ## reject the ended promise
          ended.reject(err)

        .on "end", ->
          debug("capture ended")

          ended.resolve()
        .save(name)
        
    startCapturing()
    .then ({ cmd, startedVideoCapture }) ->
      return {
        cmd,    
        endVideoCapture,
        writeVideoFrame,
        startedVideoCapture,          
      }

  process: (name, cname, videoCompression, onProgress = ->) ->
    total = null

    new Promise (resolve, reject) ->
      debug("processing video from %s to %s video compression %o",
        name, cname, videoCompression)
      cmd = ffmpeg()
      .input(name)
      .videoCodec("libx264")
      .outputOptions([
        "-preset fast"
        "-crf #{videoCompression}"
      ])
      .on "start", (command) ->
        debug("compression started %o", { command })

      .on "codecData", (data) ->
        debug("compression codec data: %o", data)

        total = utils.timemarkToSeconds(data.duration)

      .on "stderr", (stderr) ->
        debug("compression stderr log %o", { message: stderr })

      .on "progress", (progress) ->
        ## bail if we dont have total yet
        return if not total

        debug("compression progress: %o", progress)

        progressed = utils.timemarkToSeconds(progress.timemark)

        onProgress(progressed / total)

      .on "error", (err, stdout, stderr) ->
        debug("compression errored: %o", { error: err.message, stdout, stderr })

        reject(err)

      .on "end", ->
        debug("compression ended")

        ## we are done progressing
        onProgress(1)

        ## rename and obliterate the original
        fs.moveAsync(cname, name, {
          overwrite: true
        })
        .then ->
          resolve()
      .save(cname)

}
