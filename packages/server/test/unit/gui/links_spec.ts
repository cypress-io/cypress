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

  it('appends get parameters', () => {
    openExternal({
      url: 'https://on.cypress.io/string-link',
      params: {
        search: 'term',
      },
    })

    expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link?search=term')
  })

  it('automatically adds utm_source if utm params are present', () => {
    openExternal({
      url: 'https://on.cypress.io/string-link',
      params: {
        utm_medium: 'GUI Tab',
        utm_campaign: 'Learn More',
      },
    })

    expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link?utm_medium=GUI+Tab&utm_campaign=Learn+More&utm_source=Test+Runner')
  })
})
