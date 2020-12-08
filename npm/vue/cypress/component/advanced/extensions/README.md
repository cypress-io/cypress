# Extensions

You can use the `extensions` option to install global components, mixins, plugins, etc.

```js
import Bar from './Bar.vue'

const Foo = {
  template: '<h1>Hello world</h1>'
}

mount(App, { 
  extensions: {
    components: {
      Foo, // registered globally for use in your component.
      Bar
    }
  }
})
```

See component [Extension.vue](./Extensions.vue) and [extensions.spec.js](./extensions.spec.js)
