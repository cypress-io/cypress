import systemTests from '../lib/system-tests'

describe('Electron std{out,err} ALSA warnings', function () {
  it('does not render warnings in the stdout', function () {
    return systemTests.exec(this, {
      project: 'e2e',
      spec: 'embedded_video_with_audio.cy.js',
      browser: 'electron',
    }).then(({ stdout, stderr, code }) => {
      expect(stderr).not.to.include('sysctlbyname for kern.hv_vmm_present failed with status -1')
    })
  })
})
