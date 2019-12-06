/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _          = require("lodash");
const la         = require("lazy-ass");
const os         = require("os");
const path       = require("path");
const utils      = require("fluent-ffmpeg/lib/utils");
const debug      = require("debug")("cypress:server:video");
const ffmpeg     = require("fluent-ffmpeg");
const stream     = require("stream");
const Promise    = require("bluebird");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const BlackHoleStream = require("black-hole-stream");
const fs         = require("./util/fs");

//# extra verbose logs for logging individual frames
const debugFrames = require("debug")("cypress-verbose:server:video:frames");

debug("using ffmpeg from %s", ffmpegPath);

ffmpeg.setFfmpegPath(ffmpegPath);

const deferredPromise = function() {
  let reject;
  let resolve = (reject = null);
  const promise = new Promise(function(_resolve, _reject) {
    resolve = _resolve;
    return reject = _reject;
  });
  return { promise, resolve, reject };
};

module.exports = {
  getMsFromDuration(duration) {
    return utils.timemarkToSeconds(duration) * 1000;
  },

  getCodecData(src) {
    return new Promise(function(resolve, reject) {
      return ffmpeg()
      .on("stderr", stderr => debug("get codecData stderr log %o", { message: stderr })).on("codecData", resolve)
      .input(src)
      .format("null")
      .output(new BlackHoleStream())
      .run();}).tap(data =>
      debug('codecData %o', {
        src,
        data,
      })).tapCatch(err => debug("getting codecData failed", { err }));
  },

  copy(src, dest) {
    debug("copying from %s to %s", src, dest);
    return fs
    .copyAsync(src, dest, {overwrite: true})
    .catch({code: "ENOENT"}, function() {});
  },
      //# dont yell about ENOENT errors

  start(name, options = {}) {
    const pt         = stream.PassThrough();
    const ended      = deferredPromise();
    let done       = false;
    const errored    = false;
    let written    = false;
    let logErrors  = true;
    let wantsWrite = true;
    let skipped    = 0;

    _.defaults(options, {
      onError() {}
    });

    const endVideoCapture = function() {
      done = true;

      if (!written) {
        //# when no data has been written this will
        //# result in an 'pipe:0: End of file' error
        //# for so we need to account for that
        //# and not log errors to the console
        logErrors = false;
      }

      pt.end();

      //# return the ended promise which will eventually
      //# get resolve or rejected
      return ended.promise;
    };

    const writeVideoFrame = function(data) {
      //# make sure we haven't ended
      //# our stream yet because paint
      //# events can linger beyond
      //# finishing the actual video
      if (done) { return; }

      //# we have written at least 1 byte
      written = true;

      debugFrames("writing video frame");

      if (wantsWrite) {
        if (!(wantsWrite = pt.write(data))) {
          return pt.once("drain", function() {
            debugFrames("video stream drained");

            return wantsWrite = true;
          });
        }
      } else {
        skipped += 1;

        return debugFrames("skipping video frame %o", { skipped });
      }
    };

    const startCapturing = () =>
      new Promise(function(resolve) {
        let cmd;
        return cmd = ffmpeg({
          source: pt,
          priority: 20
        })
        .inputFormat("image2pipe")
        .inputOptions("-use_wallclock_as_timestamps 1")
        .videoCodec("libx264")
        .outputOptions("-preset ultrafast")
        .on("start", function(command) {
          debug("capture started %o", { command });

          return resolve({
            cmd,
            startedVideoCapture: new Date,
          });
      }).on("codecData", data => debug("capture codec data: %o", data)).on("stderr", stderr => debug("capture stderr log %o", { message: stderr })).on("error", function(err, stdout, stderr) {
          debug("capture errored: %o", { error: err.message, stdout, stderr });

          //# if we're supposed log errors then
          //# bubble them up
          if (logErrors) {
            options.onError(err, stdout, stderr);
          }

          //# reject the ended promise
          return ended.reject(err);
        }).on("end", function() {
          debug("capture ended");

          return ended.resolve();
        }).save(name);
      })
    ;

    return startCapturing()
    .then(({ cmd, startedVideoCapture }) =>
      ({
        cmd,
        endVideoCapture,
        writeVideoFrame,
        startedVideoCapture,
      }));
  },

  process(name, cname, videoCompression, onProgress = function() {}) {
    let total = null;

    return new Promise(function(resolve, reject) {
      let cmd;
      debug("processing video from %s to %s video compression %o",
        name, cname, videoCompression);
      return cmd = ffmpeg()
      .input(name)
      .videoCodec("libx264")
      .outputOptions([
        "-preset fast",
        `-crf ${videoCompression}`
      ])
      .on("start", command => debug("compression started %o", { command })).on("codecData", function(data) {
        debug("compression codec data: %o", data);

        return total = utils.timemarkToSeconds(data.duration);
      }).on("stderr", stderr => debug("compression stderr log %o", { message: stderr })).on("progress", function(progress) {
        //# bail if we dont have total yet
        if (!total) { return; }

        debug("compression progress: %o", progress);

        const progressed = utils.timemarkToSeconds(progress.timemark);

        return onProgress(progressed / total);
      }).on("error", function(err, stdout, stderr) {
        debug("compression errored: %o", { error: err.message, stdout, stderr });

        return reject(err);
      }).on("end", function() {
        debug("compression ended");

        //# we are done progressing
        onProgress(1);

        //# rename and obliterate the original
        return fs.moveAsync(cname, name, {
          overwrite: true
        })
        .then(() => resolve());
      }).save(cname);
    });
  }

};
