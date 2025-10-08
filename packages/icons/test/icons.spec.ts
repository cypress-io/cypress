import { describe, it, expect } from 'vitest'
import * as iconsESM from '../index.mjs'
import * as iconsCjs from '../index.js'

const cwd = process.cwd()

describe('Cypress Icons', function () {
  it('returns path to favicon', function () {
    expect(iconsESM.getPathToFavicon('favicon-red.ico')).toEqual(`${cwd }/dist/favicon/favicon-red.ico`)
    expect(iconsCjs.getPathToFavicon('favicon-red.ico')).toEqual(`${cwd }/dist/favicon/favicon-red.ico`)
  })

  it('returns path to icon', function () {
    expect(iconsESM.getPathToIcon('cypress.icns')).toEqual(`${cwd }/dist/icons/cypress.icns`)
    expect(iconsCjs.getPathToIcon('cypress.icns')).toEqual(`${cwd }/dist/icons/cypress.icns`)
  })

  it('returns path to logo', function () {
    expect(iconsESM.getPathToLogo('cypress-bw.png')).toEqual(`${cwd }/dist/logo/cypress-bw.png`)
    expect(iconsCjs.getPathToLogo('cypress-bw.png')).toEqual(`${cwd }/dist/logo/cypress-bw.png`)
  })
})
