import mockery from 'mockery'
import path from 'path'

export const mockElectron = (mockeryInstance: typeof mockery) => {
  // stub out the entire electron object for our stub
  // we must use an absolute path here because of the way mockery internally loads this
  // module - meaning the first time electron is required it'll use this path string
  // so because its required from a separate module we must use an absolute reference to it
  mockeryInstance.registerSubstitute(
    'electron',
    path.join(__dirname, './support/helpers/electron_stub'),
  )

  // stub out electron's original-fs module which is available when running in electron
  mockeryInstance.registerMock('original-fs', {})
}

export const enable = (mockeryInstance: typeof mockery) => {
  mockeryInstance.enable({
    warnOnUnregistered: false,
  })
}
