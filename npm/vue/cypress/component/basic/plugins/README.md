# plugins

Spec file [plugin-spec.js](plugin-spec.js) shows how to load plugins while doing testing. The plugins might require options, which you can pass using array syntax

```js
const use = [
  MyPlugin, // this plugin does not need options
  [MyPluginWithOptions, { label: 'testing' }], // this plugin needs options
]

// extend Vue with plugins
const extensions = {
  use,
}

mount({}, { extensions })
```

See [Vue plugin docs](https://vuejs.org/v2/guide/plugins.html)
