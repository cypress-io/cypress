/* global jest */

jest.autoMockOff()
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'switch-false')
