# styles

If your component imports its own style, the style should be applied during the Cypress test.

```js
// MyComponent.vue
<template>
  <div class="darkred">
    <p class="green">I get my style from main.css</p>
  </div>
</template>

<style lang="scss">
  @import "./src/styles/main.css";
</style>
```

You can also load styles in the following ways:

## Import in the spec file

```js
import '../styles/main.css'

const myComponent = {
  template: '<button class="orange"><slot/></button>'
}

mount(myComponent)
```

## Import in the component support file

If you have stylesheets that should apply to all of your components, you can import those from your component support file.

```js
// cypress/support/component.js
import '../styles/main.css'
...

// MyComponent.spec.js
const myComponent = {
  template: '<button class="orange"><slot/></button>'
}

mount(myComponent)
```
