import { expect } from 'chai'
import { appName } from '@app/main'

it('verifies path mapping', () => {
  expect(appName).to.equal('Best App Ever')
})
