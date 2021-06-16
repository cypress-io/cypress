exports['webpack preprocessor - e2e correctly preprocesses the file 1'] = `
it("is a test",(function(){expect(1).to.equal(1),expect(2).to.equal(2),expect(Math.min.apply(Math,[3,4])).to.equal(3)}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AY3lwcmVzcy93ZWJwYWNrLXByZXByb2Nlc3Nvci8uL3Rlc3QvX3Rlc3Qtb3V0cHV0L2V4YW1wbGVfc3BlYy5qcyJdLCJuYW1lcyI6WyJpdCIsImV4cGVjdCIsInRvIiwiZXF1YWwiLCJNYXRoIiwibWluIl0sIm1hcHBpbmdzIjoiQUFBQUEsR0FBRyxhQUFhLFdBR2RDLE9BRmdCLEdBRU5DLEdBQUdDLE1BQU0sR0FDbkJGLE9BSG1CLEdBR1RDLEdBQUdDLE1BQU0sR0FDbkJGLE9BQU9HLEtBQUtDLElBQUwsTUFBQUQsS0FBWSxDQUFDLEVBQUcsS0FBS0YsR0FBR0MsTUFBTSIsImZpbGUiOiJleGFtcGxlX3NwZWNfb3V0cHV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaXQoJ2lzIGEgdGVzdCcsICgpID0+IHtcbiAgY29uc3QgW2EsIGJdID0gWzEsIDJdXG5cbiAgZXhwZWN0KGEpLnRvLmVxdWFsKDEpXG4gIGV4cGVjdChiKS50by5lcXVhbCgyKVxuICBleHBlY3QoTWF0aC5taW4oLi4uWzMsIDRdKSkudG8uZXF1YWwoMylcbn0pXG4iXSwic291cmNlUm9vdCI6IiJ9
`

exports['webpack preprocessor - e2e has less verbose syntax error 1'] = `
Webpack Compilation Error
Module build failed (from ./node_modules/babel-loader/lib/index.js):
SyntaxError: <path>/_test-output/syntax_error_spec.js: Unexpected token (1:18)

[0m[31m[1m>[22m[39m[90m 1 |[39m describe([32m'fail'[39m[33m,[39m [33m-[39m[33m>[39m)[0m
[0m [90m   |[39m                   [31m[1m^[22m[39m[0m
[0m [90m 2 |[39m[0m
`

exports['webpack preprocessor - e2e has less verbose "Module not found" error 1'] = `
Webpack CompLooked for and couldn't find the file at the following paths:resolve './does/not-exist' in '<path>/_test-output'
`
