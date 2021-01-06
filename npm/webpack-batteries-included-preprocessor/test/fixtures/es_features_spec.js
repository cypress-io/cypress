// ES module / CommonJS interop
import { commonJSExport } from './export-commonjs'
const { es2015Export, SampleClass, asyncFn } = require('./export-es2015')

expect(commonJSExport.commonJSKey).to.equal('commonJSValue')
expect(es2015Export.es2015Key).to.equal('es2015Value')

// object spread
const obj = {
  ...commonJSExport,
  ...es2015Export,
}

expect(obj).to.eql({
  commonJSKey: 'commonJSValue',
  es2015Key: 'es2015Value',
})

// class properties
expect(SampleClass.staticProp).to.equal('staticProp')
expect((new SampleClass()).prop).to.equal('prop')

;(async () => {
  // async/await
  const value = await asyncFn()

  expect(value).to.equal('value')
})
