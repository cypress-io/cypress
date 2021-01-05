expect(typeof global).to.equal('object')
expect(global.setTimeout).and.be.a('function')
expect(__filename).to.include('node_shim_spec.js')
expect(__dirname).to.include('_test-output')
