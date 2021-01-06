import { expect } from 'chai'
import commonJSFn from '../export-commonjs-function'

expect(commonJSFn()).to.equal('return value')
