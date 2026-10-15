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

  it('opens http urls', () => {
    openExternal('http://localhost:3000/')
    expect(shell.openExternal).to.be.calledWith('http://localhost:3000/')
  })

  ;[
    'file:///etc/test',
    'smb://test.example/share',
    'vscode://file/etc/test',
    'javascript:alert(1)',
    'not a url',
  ].forEach((url) => {
    it(`does not open ${url}`, async () => {
      await expect(openExternal(url)).to.be.rejectedWith('Only http and https URLs can be opened externally')

      expect(shell.openExternal).not.to.be.called
    })
  })

  it('does not open a url that is not a string', async () => {
    await expect(openExternal(['https://on.cypress.io'] as unknown as string)).to.be.rejectedWith('Only http and https URLs can be opened externally')

    expect(shell.openExternal).not.to.be.called
  })
})
