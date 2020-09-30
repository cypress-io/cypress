/// <reference types="cypress"/>
/* eslint-disable */


/* EXPECT: {
  expectedResults: {
    totalFailed: 1
  },
  // https://github.com/cypress-io/cypress-webpack-preprocessor/issues/64
  stdoutInclude: 'Webpack Compilation Error'
} */

describe('foo', ()=>{
  it('has syntax error' () => {}})
})
