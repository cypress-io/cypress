# styles

If your component imports its own style, the style should be applied during the Cypress test.

```js
// Footer.jsx
import React from 'react'
import './main.css' // <== style import
export default Footer = () => ...

// Footer.spec.js
import React from 'react'
import Footer from './Footer.jsx'
import { mount } from '@cypress/react'

it('is stylish', () => {
  mount(<Footer />)
  // styles are there because the component has imported them
  // and the bundler handled it for us
})
```

## Import in the spec file

Sometimes the root component imports the style, or it is included from `src/public/index.html` file. We can usually import the style directly from the spec file:

```js
// Footer.jsx
import React from 'react'
export default Footer = () => ...

// Footer.spec.js
import React from 'react'
import { mount } from '@cypress/react'
import Footer from './Footer.jsx'
import './main.css' // <== style import

it('is stylish', () => {
  mount(<Footer />)
  // styles are there because the spec has imported the CSS file
})
```

## Import in the component support file

If you have stylesheets that should apply to all of your components, you can import those in your component support file.

```js
// cypress/support/component.js
import './main.css'
...

// Footer.spec.js
import React from 'react'
import { mount } from '@cypress/react'
import Footer from './Footer.jsx'

it('is stylish', () => {
  mount(<Footer />)
  // styles are there because the component support file imported the CSS file
})
```
### Additional markup

The global style might assume a certain DOM structure. You can "mimic" this structure by surrounding the component with additional elements with necessary styles. For example, this is the Footer component from [bahmutov/todomvc-react](https://github.com/bahmutov/todomvc-react) repository:

```css
.todoapp {
  ...;
}

.footer {
  ...;
}
```

```js
import React from 'react'
import { mount } from '@cypress/react'
import { Footer } from './footer'
// import app's style so the footer looks real
import 'todomvc-app-css/index.css'

describe('footer component', () => {
  it('calls onClearCompleted if there are completed items', () => {
    // to make the app look just like
    // it would in a real application
    // add a section with class "todoapp" around the footer
    mount(
      <section className="todoapp">
        <Footer
          itemsLeft={10}
          completedCount={2}
          onClearCompleted={cy.stub().as('clear')}
        />
      </section>,
    )
    // component is running like a mini web app
    // we can interact with it using normal Cypress commands
    // https://on.cypress.io/api
    cy.contains('Clear completed').click()
    cy.get('@clear').should('have.been.calledOnce')
  })
})
```

The component is rendered with the correct styles:

![Footer component](../images/footer.png)
