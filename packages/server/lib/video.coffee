_          = require("lodash")
utils      = require("fluent-ffmpeg/lib/utils")
ffmpeg     = require("fluent-ffmpeg")
stream     = require("stream")
Promise    = require("bluebird")
ffmpegPath = require("@ffmpeg-installer/ffmpeg").path
debug      = require("debug")("cypress:server:video")

fs         = require("./util/fs")

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  copy: (src, dest) ->
    fs
    .copyAsync(src, dest, {overwrite: true})
    .catch {code: "ENOENT"}, ->
      ## dont yell about ENOENT errors

  start: (name, options = {}) ->
    pt         = stream.PassThrough()
    started    = Promise.pending()
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

    end = ->
      done = true

      if not written
        ## when no data has been written this will
        ## result in an 'pipe:0: End of file' error
        ## for ffmpeg so we need to account for that
        ## and not log errors to the console
        logErrors = false

      pt.end()

      ## return the ended promise which will eventually
      ## get resolve or rejected
      return ended.promise

    write = (data) ->
      ## make sure we haven't ended
      ## our stream yet because paint
      ## events can linger beyond
      ## finishing the actual video
      return if done

      ## we have written at least 1 byte
      written = true

      if wantsWrite
        if not wantsWrite = pt.write(data)
          pt.once "drain", ->
            wantsWrite = true
      else
        skipped += 1
        # console.log("skipping frame. total is", skipped)

    cmd = ffmpeg({
      source: pt
      priority: 20
    })
    .inputFormat("image2pipe")
    .inputOptions("-use_wallclock_as_timestamps 1")
    .videoCodec("libx264")
    .outputOptions("-preset ultrafast")
    .on "start", (line) ->
      debug("ffmpeg started")

      started.resolve(new Date)
      # .on "codecData", (data) ->
      # console.log "codec data", data
      # .on("error", options.onError)
    .on "error", (err, stdout, stderr) ->
      debug("ffmpeg errored:", err.message)

      ## if we're supposed log errors then
      ## bubble them up
      if logErrors
        options.onError(err, stdout, stderr)

      err.recordingVideoFailed = true

      ## reject the ended promise
      ended.reject(err)

    .on "end", ->
      debug("ffmpeg ended")
      
      ended.resolve()
    .save(name)

    return {
      cmd:     cmd
      end:     end
      start:   started.promise
      write:   write
    }

  process: (name, cname, videoCompression, onProgress = ->) ->
    total = null

    new Promise (resolve, reject) ->
      cmd = ffmpeg()
      .input(name)
      .videoCodec("libx264")
      .outputOptions([
        "-preset fast"
        "-crf #{videoCompression}"
      ])
      .save(cname)
      .on "codecData", (data) ->
        total = utils.timemarkToSeconds(data.duration)
      .on "progress", (progress) ->
        ## bail if we dont have total yet
        return if not total

        progressed = utils.timemarkToSeconds(progress.timemark)

        onProgress(progressed / total)
      .on "error", (err, stdout, stderr) ->
        reject(err)
      .on "end", ->
        ## we are done progressing
        onProgress(1)

        ## rename and obliterate the original
        fs.moveAsync(cname, name, {
          overwrite: true
        })
        .then ->
          resolve()

      # setTimeout ->
      #   cmd.kill()
      # , 100
}
