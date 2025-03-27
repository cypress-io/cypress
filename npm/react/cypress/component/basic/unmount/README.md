# unmount

If you need to test what the component is doing when it is being unmounted simply `mount` a blank component.

```js
import { mount } from '@cypress/react'
it('calls unmount prop', () => {
  // async command
  mount(...)

  // cy commands

  // mount a blank component to unmount the previous component
  mount(<div />)
  // confirm the component has been unmounted
  // and performed everything needed in its
  // componentWillUnmount method
})
```

See [comp-spec.js](comp-spec.js)
