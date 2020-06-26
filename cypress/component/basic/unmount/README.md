# unmount

If you need to test what the component is doing when it is being unmounted, use `unmount` function.

```js
import { mount, unmount } from 'cypress-react-unit-test'
it('calls unmount prop', () => {
  // async command
  mount(...)
  // cy commands

  // now let's unmount (async command)
  unmount()

  // confirm the component has been unmounted
  // and performed everything needed in its
  // componentWillUnmount method
})
```

See [unmount-spec.js](unmount-spec.js) and [comp-spec.js](comp-spec.js)
