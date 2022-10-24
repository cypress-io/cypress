exports['webpack preprocessor - e2e correctly preprocesses the file 1'] = `
it("is a test",(function(){expect(1).to.equal(1),expect(2).to.equal(2),expect(Math.min.apply(Math,[3,4])).to.equal(3)}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhhbXBsZV9zcGVjX291dHB1dC5qcyIsIm1hcHBpbmdzIjoiQUFBQUEsR0FBRyxhQUFhLFdBR2RDLE9BRmdCLEdBRU5DLEdBQUdDLE1BQU0sR0FDbkJGLE9BSG1CLEdBR1RDLEdBQUdDLE1BQU0sR0FDbkJGLE9BQU9HLEtBQUtDLElBQUwsTUFBQUQsS0FBWSxDQUFDLEVBQUcsS0FBS0YsR0FBR0MsTUFBTSIsInNvdXJjZXMiOlsid2VicGFjazovL0BjeXByZXNzL3dlYnBhY2stcHJlcHJvY2Vzc29yLy4vdGVzdC9fdGVzdC1vdXRwdXQvZXhhbXBsZV9zcGVjLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIml0KCdpcyBhIHRlc3QnLCAoKSA9PiB7XG4gIGNvbnN0IFthLCBiXSA9IFsxLCAyXVxuXG4gIGV4cGVjdChhKS50by5lcXVhbCgxKVxuICBleHBlY3QoYikudG8uZXF1YWwoMilcbiAgZXhwZWN0KE1hdGgubWluKC4uLlszLCA0XSkpLnRvLmVxdWFsKDMpXG59KVxuIl0sIm5hbWVzIjpbIml0IiwiZXhwZWN0IiwidG8iLCJlcXVhbCIsIk1hdGgiLCJtaW4iXSwic291cmNlUm9vdCI6IiJ9
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
Webpack Compilation Error
Module not found: Error: Can't resolve './does/not-exist' in '<path>/_test-output'
`
