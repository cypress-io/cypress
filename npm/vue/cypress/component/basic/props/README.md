# props

Perhaps the simplest way to mount components and pass props is via `propsData`

```js
const messages = ['one 🍎', 'two 🍌']
mount(MessageList, { propsData: { messages } })
```

See [message-list-spec.js](message-list-spec.js) for all ways to set and change props.
