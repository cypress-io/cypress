import { expect } from 'chai'

// make sure built in resolves correctly in mjs through the provide plugin, including process & buffer
process.env.foo = 'bar'

const buffer = new Buffer('foo');

expect(true).to.be.true
