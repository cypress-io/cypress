# Mocking ES6 imports

Vue component in [Hello.vue](Hello.vue) imports a named ES6 import from [greeting.js](greeting.js). From the test [spec.js](spec.js) we can mock that import to make testing simpler.

![Test with mocking and without](images/mocking.png)

## Details

The imports mocking is done using `@babel/plugin-transform-modules-commonjs` inserted as a `babel-loader` plugin automatically.
