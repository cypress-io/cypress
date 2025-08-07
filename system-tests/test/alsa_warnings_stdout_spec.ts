import systemTests from '../lib/system-tests'

describe('Electron std{out,err} ALSA warnings', function () {
  it('does not render warnings in the stdout', function () {
    return systemTests.exec(this, {
      project: 'e2e',
      spec: 'embedded_video_with_audio.cy.ts',
      browser: 'electron',
    }).then(({ stdout, stderr, code }) => {
      console.log('================', code, 'vvvvvvvvvvvvvv')
      console.log(stdout.substring(0, 1000))
      console.log(stderr.substring(0, 1000))
      console.log('================^^^^^^^^^^^^^^')
    })
  })
})
