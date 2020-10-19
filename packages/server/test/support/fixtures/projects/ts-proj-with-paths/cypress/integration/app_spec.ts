import { appName } from '@app/main'

it('verifies path mapping', () => {
  // @ts-ignore
  expect(appName).to.equal('Best App Ever')
})
