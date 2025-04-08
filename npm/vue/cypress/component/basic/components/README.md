# global components

During mounting, you can register other components, even fake ones. See [spec.cy.js](spec.cy.js)

```js
import MessageList from '../MessageList.vue'
// two different components, each gets "numbers" list
// into its property "messages"
const template = `
  <div>
    <message-list :messages="numbers"/>
    <a-list :messages="numbers"/>
  </div>
`
// our top level data
const data = () => ({ numbers: ['uno', 'dos'] })
// register same component globally under different names
const components = {
  'message-list': MessageList,
  'a-list': MessageList,
}
// extend Vue with global components
const extensions = {
  components,
}
beforeEach(mount({ template, data }, { extensions }))
```

![Components spec](./images/components.png)

See [Vue component docs](https://vuejs.org/v2/api/#Vue-component)
