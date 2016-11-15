_          = require("lodash")
fs         = require("fs-extra")
utils      = require("fluent-ffmpeg/lib/utils")
ffmpeg     = require("fluent-ffmpeg")
stream     = require("stream")
Promise    = require("bluebird")
ffmpegPath = require("@ffmpeg-installer/ffmpeg").path

fs = Promise.promisifyAll(fs)

ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = {
  copy: (src, dest) ->
    fs
    .copyAsync(src, dest, {clobber: true})
    .catch {code: "ENOENT"}, ->
      ## dont yell about ENOENT errors

  start: (name, options = {}) ->
    pt      = stream.PassThrough()
    started = Promise.pending()
    ended   = Promise.pending()
    done    = false
    errored = false

    _.defaults(options, {
      onError: ->
    })

    end = ->
      pt.end()

      done = true

      if errored
        errored.recordingVideoFailed = true
        Promise.reject(errored)
      else
        Promise.resolve(ended.promise)

    write = (data) ->
      ## make sure we haven't ended
      ## our stream yet because paint
      ## events can linger beyond
      ## finishing the actual video
      if not done
        pt.write(data)

    cmd = ffmpeg({
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
      started.resolve(new Date)
    # .on "codecData", (data) ->
      # console.log "codec data", data
    # .on("error", options.onError)
    .on "error", (err, stdout, stderr) ->
      options.onError(err, stdout, stderr)

      errored = err
      # ended.reject(err)
      # console.log "error occured here", arguments
      ## TODO: call into lib/errors here
      # console.log "ffmpeg failed", err
      # ended.reject(err)
    .on "end", ->
      ended.resolve()

    # setTimeout ->
    #   cmd.kill()
    # , 1000

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
          clobber: true
        })
        .then ->
          resolve()

      # setTimeout ->
      #   cmd.kill()
      # , 100
}