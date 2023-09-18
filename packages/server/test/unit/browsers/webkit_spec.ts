require('../../spec_helper')

import { expect } from 'chai'

import * as webkit from '../../../lib/browsers/webkit'

describe('lib/browsers/webkit', () => {
  context('#connectProtocolToBrowser', () => {
    it('throws error', () => {
      expect(webkit.connectProtocolToBrowser).to.throw('Protocol is not yet supported in WebKit.')
    })
  })
})
