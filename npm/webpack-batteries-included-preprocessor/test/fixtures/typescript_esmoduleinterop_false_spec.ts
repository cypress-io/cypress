import { expect } from 'chai'
import * as commonJSFn from './export-commonjs-function'

expect(commonJSFn()).to.equal('return value')
