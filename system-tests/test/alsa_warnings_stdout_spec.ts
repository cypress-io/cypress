import systemTests from '../lib/system-tests'

describe('Electron sysctrlbyname warning', function () {
  it('does not render warnings in the stdout', function () {
    return systemTests.exec(this, {
      project: 'e2e',
      spec: 'embedded_video_with_audio.cy.js',
      browser: 'electron',
    }).then(({ stderr }) => {
      expect(stderr).not.to.include('sysctlbyname for kern.hv_vmm_present failed with status -1')
    })
  })
})
