import { describe, it, expect } from 'vitest'
import * as icons from '../index'

const cwd = process.cwd()

describe('Cypress Icons', function () {
  it('returns path to favicon', function () {
    expect(icons.getPathToFavicon('favicon-red.ico')).toEqual(`${cwd }/dist/favicon/favicon-red.ico`)
  })

  it('returns path to icon', function () {
    expect(icons.getPathToIcon('cypress.icns')).toEqual(`${cwd }/dist/icons/cypress.icns`)
  })

  it('returns path to logo', function () {
    expect(icons.getPathToLogo('cypress-bw.png')).toEqual(`${cwd }/dist/logo/cypress-bw.png`)
  })
})
