# mocking axios

**Help wanted**

How can `import ... from '...'` be mocked from Vue and from JS spec files? In plain JS files we use '@babel/plugin-transform-modules-commonjs' plugin so that all imports from file X are the same object and the individual properties can be stubbed using `cy.stub(X, 'import name')`. But the `vue-loader` used to transpile Vue files seems to not allow additional Babel plugins?

See [mock-get-spec.js](mock-get-spec.js) and [AxiosGet.vue](AxiosGet.vue) for an open problem.
