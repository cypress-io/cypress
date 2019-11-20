/* global jest */

jest.autoMockOff()
const defineTest = require('jscodeshift/dist/testUtils').defineTest

defineTest(__dirname, 'switch-false')
defineTest(__dirname, 'empty-catch')
defineTest(__dirname, 'remove-comment-sharp')
defineTest(__dirname, 'arrow-comment')
defineTest(__dirname, 'no-cond-assign')
