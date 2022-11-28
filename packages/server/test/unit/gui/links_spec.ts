import '../../spec_helper'

import { expect } from 'chai'
import 'sinon-chai'

import { shell } from 'electron'

import { openExternal } from '../../../lib/gui/links'

describe('lib/gui/links', () => {
  beforeEach(() => {
    shell.openExternal = sinon.stub()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('opens urls passed as strings', () => {
    openExternal('https://on.cypress.io/string-link')
    expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link')
  })
})
