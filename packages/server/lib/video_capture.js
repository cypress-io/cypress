"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process = exports.start = exports.copy = exports.getChapters = exports.getCodecData = exports.getMsFromDuration = exports.generateFfmpegChaptersConfig = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const utils_1 = tslib_1.__importDefault(require("fluent-ffmpeg/lib/utils"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const fluent_ffmpeg_1 = tslib_1.__importDefault(require("fluent-ffmpeg"));
const stream_1 = tslib_1.__importDefault(require("stream"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const ffmpeg_1 = require("@ffmpeg-installer/ffmpeg");
const black_hole_stream_1 = tslib_1.__importDefault(require("black-hole-stream"));
const fs_1 = require("./util/fs");
const debug = (0, debug_1.default)('cypress:server:video');
const debugVerbose = (0, debug_1.default)('cypress-verbose:server:video');
// extra verbose logs for logging individual frames
const debugFrames = (0, debug_1.default)('cypress-verbose:server:video:frames');
debug('using ffmpeg from %s', ffmpeg_1.path);
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.path);
const deferredPromise = function () {
    let reject;
    let resolve;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    return { promise, resolve, reject };
};
function generateFfmpegChaptersConfig(tests) {
    if (!tests) {
        return;
    }
    const configString = tests.map((test) => {
        return test.attempts.map((attempt, i) => {
            const { videoTimestamp, wallClockDuration } = attempt;
            let title = test.title ? test.title.join(' ') : '';
            if (i > 0) {
                title += `attempt ${i}`;
            }
            return [
                '[CHAPTER]',
                'TIMEBASE=1/1000',
                `START=${videoTimestamp - wallClockDuration}`,
                `END=${videoTimestamp}`,
                `title=${title}`,
            ].join('\n');
        }).join('\n');
    }).join('\n');
    return `;FFMETADATA1\n${configString}`;
}
exports.generateFfmpegChaptersConfig = generateFfmpegChaptersConfig;
function getMsFromDuration(duration) {
    return utils_1.default.timemarkToSeconds(duration) * 1000;
}
exports.getMsFromDuration = getMsFromDuration;
function getCodecData(src) {
    return new bluebird_1.default((resolve, reject) => {
        return (0, fluent_ffmpeg_1.default)()
            .on('stderr', (stderr) => {
            return debug('get codecData stderr log %o', { message: stderr });
        }).on('codecData', resolve)
            .input(src)
            .format('null')
            .output(new black_hole_stream_1.default())
            .run();
    }).tap((data) => {
        return debug('codecData %o', {
            src,
            data,
        });
    }).tapCatch((err) => {
        return debug('getting codecData failed', { err });
    });
}
exports.getCodecData = getCodecData;
function getChapters(fileName) {
    return new bluebird_1.default((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(fileName, ['-show_chapters'], (err, metadata) => {
            if (err) {
                return reject(err);
            }
            resolve(metadata);
        });
    });
}
exports.getChapters = getChapters;
function copy(src, dest) {
    debug('copying from %s to %s', src, dest);
    return fs_1.fs
        .copy(src, dest, { overwrite: true })
        .catch((err) => {
        if (err.code === 'ENOENT') {
            debug('caught ENOENT error on copy, ignoring %o', { src, dest, err });
            return;
        }
        throw err;
    });
}
exports.copy = copy;
function start(options) {
    const pt = new stream_1.default.PassThrough();
    const ended = deferredPromise();
    let done = false;
    let wantsWrite = true;
    let skippedChunksCount = 0;
    let writtenChunksCount = 0;
    lodash_1.default.defaults(options, {
        onError() { },
    });
    const endVideoCapture = function (waitForMoreChunksTimeout = 3000) {
        debugFrames('frames written:', writtenChunksCount);
        // in some cases (webm) ffmpeg will crash if fewer than 2 buffers are
        // written to the stream, so we don't end capture until we get at least 2
        if (writtenChunksCount < 2) {
            return new bluebird_1.default((resolve) => {
                pt.once('data', resolve);
            })
                .then(() => endVideoCapture())
                .timeout(waitForMoreChunksTimeout);
        }
        done = true;
        pt.end();
        // return the ended promise which will eventually
        // get resolve or rejected
        return ended.promise;
    };
    const lengths = {};
    const writeVideoFrame = function (data) {
        // make sure we haven't ended
        // our stream yet because paint
        // events can linger beyond
        // finishing the actual video
        if (done) {
            return;
        }
        // when `data` is empty, it is sent as an empty Buffer (`<Buffer >`)
        // which can crash the process. this can happen if there are
        // errors in the video capture process, which are handled later
        // on, so just skip empty frames here.
        // @see https://github.com/cypress-io/cypress/pull/6818
        if (lodash_1.default.isEmpty(data)) {
            debugFrames('empty chunk received %o', data);
            return;
        }
        if (options.webmInput) {
            if (lengths[data.length]) {
                // this prevents multiple chunks of webm metadata from being written to the stream
                // which would crash ffmpeg
                debugFrames('duplicate length frame received:', data.length);
                return;
            }
            lengths[data.length] = true;
        }
        writtenChunksCount++;
        debugFrames('writing video frame');
        if (wantsWrite) {
            wantsWrite = pt.write(data);
            if (!wantsWrite) {
                // ffmpeg stream isn't accepting data, so drop frames until the stream is ready to accept data
                pt.once('drain', () => {
                    debugFrames('video stream drained');
                    wantsWrite = true;
                });
            }
        }
        else {
            skippedChunksCount += 1;
            return debugFrames('skipping video frame %o', { skipped: skippedChunksCount });
        }
    };
    const startCapturing = () => {
        return new Promise((resolve) => {
            const cmd = (0, fluent_ffmpeg_1.default)({
                source: pt,
                priority: 20,
            })
                .videoCodec('libx264')
                .outputOptions('-preset ultrafast')
                .on('start', (command) => {
                debug('capture started %o', { command });
                return resolve({
                    cmd,
                    startedVideoCapture: new Date,
                });
            }).on('codecData', (data) => {
                return debug('capture codec data: %o', data);
            }).on('stderr', (stderr) => {
                return debugVerbose('capture stderr log %o', { message: stderr });
            }).on('error', (err, stdout, stderr) => {
                var _a;
                debug('capture errored: %o', { error: err.message, stdout, stderr });
                // bubble errors up
                (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, err, stdout, stderr);
                // reject the ended promise
                return ended.reject(err);
            }).on('end', () => {
                debug('capture ended');
                return ended.resolve();
            })
                // this is to prevent the error "invalid data input" error
                // when input frames have an odd resolution
                .videoFilters(`crop='floor(in_w/2)*2:floor(in_h/2)*2'`);
            if (options.webmInput) {
                cmd
                    .inputFormat('webm')
                    // assume 18 fps. This number comes from manual measurement of avg fps coming from firefox.
                    // TODO: replace this with the 'vfr' option below when dropped frames issue is fixed.
                    .inputFPS(18);
                // 'vsync vfr' (variable framerate) works perfectly but fails on top page navigation
                // since video timestamp resets to 0, timestamps already written will be dropped
                // .outputOption('-vsync vfr')
            }
            else {
                cmd
                    .inputFormat('image2pipe')
                    .inputOptions('-use_wallclock_as_timestamps 1');
            }
            return cmd.save(options.videoName);
        });
    };
    return startCapturing()
        .then(({ cmd, startedVideoCapture }) => {
        return {
            _pt: pt,
            cmd,
            endVideoCapture,
            writeVideoFrame,
            startedVideoCapture,
            restart: () => {
                throw new Error('restart cannot be called on a plain ffmpeg stream');
            },
        };
    });
}
exports.start = start;
async function process(options) {
    let total = null;
    const metaFileName = `${options.videoName}.meta`;
    const addChaptersMeta = options.chaptersConfig && await fs_1.fs.writeFile(metaFileName, options.chaptersConfig).then(() => true);
    return new Promise((resolve, reject) => {
        debug('processing video %o', options);
        const command = (0, fluent_ffmpeg_1.default)({
            priority: 20,
        })
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
        ]);
        // See https://trac.ffmpeg.org/wiki/Encode/H.264 for details about h264 options.
        const outputOptions = [
            // Preset is a tradeoff between encoding speed and filesize. It does not determine video
            // quality; It's just a tradeoff between CPU vs size.
            '-preset fast',
            // Compression Rate Factor is essentially the quality dial; 0 would be lossless
            // (big files), while 51 (the maximum) would lead to low quality (and small files).
            `-crf ${options.videoCompression}`,
            // Discussion of pixel formats is beyond the scope of these comments. See
            // https://en.wikipedia.org/wiki/Chroma_subsampling if you want the gritty details.
            // Short version: yuv420p is a standard video format supported everywhere.
            '-pix_fmt yuv420p',
            ...(options.outputOptions || []),
        ];
        if (addChaptersMeta) {
            command.input(metaFileName);
            outputOptions.push('-map_metadata 1');
        }
        let chain = command.input(options.videoName)
            .videoCodec('libx264')
            .outputOptions(outputOptions);
        if (options.videoFilters)
            chain = chain.videoFilters(options.videoFilters);
        chain
            .on('start', (command) => {
            debug('compression started %o', { command });
        })
            .on('codecData', (data) => {
            debug('compression codec data: %o', data);
            total = utils_1.default.timemarkToSeconds(data.duration);
        })
            .on('stderr', (stderr) => {
            debug('compression stderr log %o', { message: stderr });
        })
            .on('progress', (progress) => {
            var _a;
            // bail if we dont have total yet
            if (!total) {
                return;
            }
            debug('compression progress: %o', progress);
            const progressed = utils_1.default.timemarkToSeconds(progress.timemark);
            // @ts-ignore
            const percent = progressed / total;
            if (percent < 1) {
                return (_a = options.onProgress) === null || _a === void 0 ? void 0 : _a.call(options, percent);
            }
        })
            .on('error', (err, stdout, stderr) => {
            debug('compression errored: %o', { error: err.message, stdout, stderr });
            return reject(err);
        })
            .on('end', async () => {
            var _a;
            debug('compression ended');
            // we are done progressing
            (_a = options.onProgress) === null || _a === void 0 ? void 0 : _a.call(options, 1);
            // rename and obliterate the original
            await fs_1.fs.move(options.compressedVideoName, options.videoName, {
                overwrite: true,
            });
            if (addChaptersMeta) {
                await fs_1.fs.unlink(metaFileName);
            }
            resolve();
        }).save(options.compressedVideoName);
    });
}
exports.process = process;
