exports['webpack preprocessor - e2e correctly preprocesses the file 1'] = `
it("is a test",(function(){expect(1).to.equal(1),expect(2).to.equal(2),expect(Math.min.apply(Math,[3,4])).to.equal(3)}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhhbXBsZV9zcGVjX291dHB1dC5qcyIsIm1hcHBpbmdzIjoiQUFBQUEsR0FBRyxhQUFhLFdBR2RDLE9BRmdCLEdBRU5DLEdBQUdDLE1BQU0sR0FDbkJGLE9BSG1CLEdBR1RDLEdBQUdDLE1BQU0sR0FDbkJGLE9BQU9HLEtBQUtDLElBQUdDLE1BQVJGLEtBQVksQ0FBQyxFQUFHLEtBQUtGLEdBQUdDLE1BQU0sRUFDdkMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AY3lwcmVzcy93ZWJwYWNrLXByZXByb2Nlc3Nvci8uL3Rlc3QvX3Rlc3Qtb3V0cHV0L2V4YW1wbGVfc3BlYy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpdCgnaXMgYSB0ZXN0JywgKCkgPT4ge1xuICBjb25zdCBbYSwgYl0gPSBbMSwgMl1cblxuICBleHBlY3QoYSkudG8uZXF1YWwoMSlcbiAgZXhwZWN0KGIpLnRvLmVxdWFsKDIpXG4gIGV4cGVjdChNYXRoLm1pbiguLi5bMywgNF0pKS50by5lcXVhbCgzKVxufSlcbiJdLCJuYW1lcyI6WyJpdCIsImV4cGVjdCIsInRvIiwiZXF1YWwiLCJNYXRoIiwibWluIiwiYXBwbHkiXSwic291cmNlUm9vdCI6IiJ9
`

exports['webpack preprocessor - e2e has less verbose syntax error 1'] = `
Webpack Compilation Error
Module build failed (from ./node_modules/babel-loader/lib/index.js):
SyntaxError: <path>/_test-output/syntax_error_spec.js: Unexpected token (1:18)

[0m[31m[1m>[22m[39m[90m 1 |[39m describe([32m'fail'[39m[33m,[39m [33m-[39m[33m>[39m)
 [90m   |[39m                   [31m[1m^[22m[39m
 [90m 2 |[39m[0m
`

exports['webpack preprocessor - e2e has less verbose "Module not found" error 1'] = `
Webpack Compilation Error
Module not found: Error: Can't resolve './does/not-exist' in '<path>/_test-output'
`
