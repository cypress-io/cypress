# Context providers and composition

It is pretty rare case when the components depends on some top-level context. This context can be required or not, but we highly recommend you the same set of providers for testing as used for rendering this component in your real application.

It means that if you are using, for example, theme context – ideally components should be mounted with the same theme as inside your application.

## Context providers wrapping

Real-world apps often have pretty a lot of providers, and wrapping each component in several providers for each new test can be overwhelming:

```jsx
mount(
  <ThemeProvider theme={theme}>
    <I18nProvider i18n={i18n}>
      <Component prop1 prop2="2">
    </I18nProvider>
  </ThemeProvider>
)
```

That's why it can be a really nice solution to make your own `mount` or even `createMount` functions with all the wrapped providers. Let's look at an example

1. Create a file called `test-utils.ts` somewhere near your component tests folder.

```tsx
// test-utils.ts
import * as React from 'react'
import { createTheme } from './somewhere'
import { mount, MountOptions } from 'cypress-react-unit-test'

export type CustomMountOptions = MountOptions & {
  mode: 'dark' | 'light'
  locale: string
}

export const createMount = (
  element: React.ReactElement,
  { mode, locale, ...mountOpts }: MountOptions = {
    mode: 'light',
    locale: 'en-US',
  },
) => {
  mount(
    <ThemeProvider theme={createTheme({ mode })}>
      <I18nProvider i18n={i18n.cloneInstance({ lng: locale })}>
        {element}
      </I18nProvider>
    </ThemeProvider>,
    mountOpts,
  )
}
```

2. In your test file import the `createMount` hook instead of cypress-react-unit-test's `mount`

```tsx
// Button.spec.tsx
import * as React from 'react'
import Button from './Button.tsx'
import { createMount } from '../test-utils.ts'

describe('<Button />', () => {
  const mount = createMount()

  it('Renders and clicks the button', () => {
    mount(<Button> button </Button>)

    ...
  })

  it('Renders in dark mode', () => {
    const mountInDarkMode = createMount({ mode: 'dark' })

    mountInDarkMode(
      <Button> dark button </Button>
    )
  })

  context("Localized button", () => {
    const mountInFrench = createMount({ locale: 'fr' })

    it('lé button', () => {
      mountInFrench(<Button> lé button </Button>)
    })

    it('là button', () => {
      mountInFrench(<Button> là button </Button>)
    })
  })
})
```

It is also possible to create several different versions of `createMount` and use them apparently. For example you can also create a new

```jsx
export const mountWithRouter = (element, mountOptions) =>
  mount(<Router> {element} </Router>, mountOptions)

// then in your tests
mountWithRouter(<Component />)
```

And enjoy the testing with different types of `mount` function for different scenarios.
