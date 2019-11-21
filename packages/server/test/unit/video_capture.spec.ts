// import * as fs from 'fs-extra'
// import * as path from 'path'
// import bluebird from 'bluebird'
// const ffmpeg = require('fluent-ffmpeg')
// import stream from 'stream'

// import * as video_capture from '../../lib/video_capture'

// describe('video_capture', () => {
//   it('can stitch together webm frames', async () => {
//     const {
//       endVideoCapture,
//       writeVideoFrame,
//       startedVideoCapture,
//     } = await video_capture.start(

//       '/tmp/vidoutput.mp4', {
//         onError (err) {
//           throw err
//         },
//       }
//     )

//     const buffer = await fs.readFile(path.join(__dirname, '../support/fixtures/video/video_1.webm'))

//     writeVideoFrame(buffer)

//     await bluebird.delay(1000)

//     await endVideoCapture()
//     // console.log(capture)
//   }).timeout(20000)

//   it('ffmpeg test', async () => {
//     const vid = new stream.PassThrough()
//     // const vid = new stream.Duplex()

//     // vid._read = () => {}

//     bluebird.map(
//       Array(25).fill().map((x, i) => {
//         return path.join(__dirname, `../support/fixtures/video/video_${i}.webm`)
//       }), async (v) => {
//         const partialVid = await fs.readFile(v)

//         await bluebird.delay(5000)
//         vid.write(partialVid)
//         // vid.push(partialVid)
//       }
//     )

//     // vid.on('')
//     setTimeout(() => {
//       vid.end()
//     }, 30000)

//     // vid.once('drain', () => {
//     //   vid.end()
//     // })

//     await new bluebird((resolve, reject) => {
//       const cmd = ffmpeg()
//       .input(vid)
//       // .input(path.join('/home/owner/Videos/ffvideo.webm'))
//       // .format('mp4')

//       // Array(25).fill().map((x, i) => {
//       //   return path.join(__dirname, `../support/fixtures/video/video_${i}.webm`)
//       // }).forEach((v) => {
//       //   cmd.addInput(v)
//       // })
//       cmd
//       .toFormat('mp4')
//       // .videoCodec('libx264')
//       // .complexFilter(['[0][1]scale2ref[bg][gif]', '[bg]setsar=1[bg]', '[bg][gif]overlay=shortest=1'])
//       .outputOptions('-preset ultrafast')

//       // .outputOptions(['-pix_fmt yuv420p', '-movflags frag_keyframe+empty_moov', '-movflags +faststart', '-crf 20', '-b:v 500k'])
//       .videoFilters(`crop='floor(in_w/2)*2:floor(in_h/2)*2'`)
//       .inputFormat('webm')
//       .save(path.join(__dirname, 'foobar2.mp4'))
//       .on('end', resolve)
//       .on('error', reject)
//       .on('progress', console.log)
//     })
//   }).timeout(1e9)
// })
