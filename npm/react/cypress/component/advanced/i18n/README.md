## Localization Example

This example uses [react-i18next](https://react.i18next.com/) for app localization. Make sure that in "real life" application locale related setup performs at the root of application ([App.tsx](./App.tsx)) and the components are using context for localization.

Thats why in tests we also need to wrap our component with the same provider as our application. Using function composition we can create our own `mount` function which wraps the component with all required providers:

```js
const localizedMount = (node, { locale }) => {
  mount(
    <I18nextProvider i18n={i18n.cloneInstance({ lng: locale })}>
      {node}
    </I18nextProvider>,
  )
}
```
