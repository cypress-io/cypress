// ES module / CommonJS interop
import { commonJSExport } from './export-commonjs'
const { es2015Export, SampleClass, asyncFn } = require('./export-es2015')

it('is a test', () => {
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

  // async/await
  return asyncFn().then((value) => {
    expect(value).to.equal('value')
  })
})
