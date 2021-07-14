import '../../spec_helper'

import { expect } from 'chai'
import 'sinon-chai'

import { shell } from 'electron'

import { openExternal } from '../../../lib/gui/links'
import machineId from '../../../lib/util/machine_id'

describe('lib/gui/links', () => {
  beforeEach(() => {
    shell.openExternal = sinon.stub()

    sinon.stub(machineId, 'machineId').resolves('machine-id')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('opens urls passed as strings', () => {
    return openExternal('https://on.cypress.io/string-link')
    .then(() => {
      expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link')
    })
  })

  it('appends get parameters', () => {
    return openExternal({
      url: 'https://on.cypress.io/string-link',
      params: {
        search: 'term',
      },
    }).then(() => {
      expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link?search=term')
    })
  })

  it('automatically adds utm_source if utm params are present', () => {
    return openExternal({
      url: 'https://on.cypress.io/string-link',
      params: {
        utm_medium: 'GUI Tab',
        utm_campaign: 'Learn More',
      },
    }).then(() => {
      expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link?utm_medium=GUI+Tab&utm_campaign=Learn+More&utm_source=Test+Runner')
    })
  })

  it('adds machine id on request', () => {
    return openExternal({
      url: 'https://on.cypress.io/string-link',
      machineId: true,
    }).then(() => {
      expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link?machine_id=machine-id')
    })
  })

  it('adds machine id to existing parameters on request', () => {
    return openExternal({
      url: 'https://on.cypress.io/string-link',
      params: {
        search: 'term',
      },
      machineId: true,
    }).then(() => {
      expect(shell.openExternal).to.be.calledWith('https://on.cypress.io/string-link?search=term&machine_id=machine-id')
    })
  })

  it('does not add machine id on request if opening link other than on.cypress.io', () => {
    return openExternal({
      url: 'https://example.com/string-link',
      machineId: true,
    }).then(() => {
      expect(shell.openExternal).to.be.calledWith('https://example.com/string-link')
    })
  })
})
