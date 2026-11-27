# props

Perhaps the simplest way to mount components and pass props is via `props`

```js
const messages = ['one 🍎', 'two 🍌']
mount(MessageList, { props: { messages } })
```

See [message-list.cy.ts](message-list.cy.ts) for all ways to set and change props.
