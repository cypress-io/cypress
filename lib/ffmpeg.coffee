fs         = require("fs-extra")
stream     = require("stream")
Promise    = require("bluebird")
ffmpeg     = require("fluent-ffmpeg")
utils      = require("fluent-ffmpeg/lib/utils")
ffmpegPath = require("@ffmpeg-installer/ffmpeg").path

fs = Promise.promisifyAll(fs)

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  start: (name) ->
    pt      = stream.PassThrough()
    started = Promise.pending()
    ended   = Promise.pending()
    done    = false

    end = ->
      pt.end()

      done = true

      Promise.resolve(ended.promise)

    write = (data) ->
      ## make sure we haven't ended
      ## our stream yet because paint
      ## events can linger beyond
      ## finishing the actual video
      if not done
        pt.write(data)

    ffmpeg({
      source: pt
      priority: 20
    })
    .inputFormat("image2pipe")
    .inputOptions("-use_wallclock_as_timestamps 1")
    .videoCodec("libx264")
    .outputOptions("-preset ultrafast")
    .save(name)
    .on "start", (line) ->
      # console.log "spawned ffmpeg", line
      started.resolve(line)
    # .on "codecData", (data) ->
      # console.log "codec data", data
    .on "error", (err, stdout, stderr) ->
      ## TODO: call into lib/errors here
      console.log "ffmpeg failed", err
      ended.reject(err)
    .on "end", ->
      console.log "ffmpeg succeeded"
      ended.resolve()

    return {
      end:     end
      start:   started.promise
      write:   write
      # ended:   ended.promise
    }

  process: (name, cname, videoCompression, onProgress = ->) ->
    total = null

    new Promise (resolve, reject) ->
      ffmpeg()
      .input(name)
      .videoCodec("libx264")
      .outputOptions([
        "-preset fast"
        "-crf #{videoCompression}"
      ])
      .save(cname)
      # .on "start", (line) ->
        # console.log "spawned ffmpeg 2", line
      .on "codecData", (data) ->
        total = utils.timemarkToSeconds(data.duration)
        # console.log "codec data 2", data
      .on "progress", (progress) ->
        ## bail if we dont have total yet
        return if not total

        progressed = utils.timemarkToSeconds(progress.timemark)

        onProgress(progressed / total)
      .on "error", (err, stdout, stderr) ->
        console.log "ffmpeg failed 2", err
        reject(err)
      .on "end", ->
        ## we are done progressing
        onProgress(1)
        console.log "ffmpeg succeeded 2"

        ## rename and obliterate the original
        fs.moveAsync(cname, name, {
          clobber: true
        })
        .then ->
          resolve()
}