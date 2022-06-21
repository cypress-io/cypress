import { expect } from 'chai'
import * as icons from '../src/icons'

const cwd = process.cwd()

describe('Cypress Icons', function () {
  it('returns path to favicon', function () {
    expect(icons.getPathToFavicon('favicon-red.ico')).to.eq(`${cwd }/dist/favicon/favicon-red.ico`)
  })

  it('returns path to icon', function () {
    expect(icons.getPathToIcon('cypress.icns')).to.eq(`${cwd }/dist/icons/cypress.icns`)
  })

  it('returns path to logo', function () {
    expect(icons.getPathToLogo('cypress-bw.png')).to.eq(`${cwd }/dist/logo/cypress-bw.png`)
  })
})
