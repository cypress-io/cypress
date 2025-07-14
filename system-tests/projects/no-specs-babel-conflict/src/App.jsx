import React from 'react'

// Using modern JS features that babel would transform
const defaultProps = {
  title: 'Hello World',
  className: 'spec-gen-component-app',
}

function App (props = {}) {
  // Object destructuring and spread - babel would transform this
  const { title, className, ...restProps } = { ...defaultProps, ...props }

  // Template literals and arrow functions
  const getMessage = () => `${title} from React`

  return (
    <div data-cy={className} {...restProps}>
      {getMessage()}
    </div>
  )
}

// Modern export syntax
export default App

// Named export that also uses modern syntax
export const AppWithDefaults = (props) => <App {...defaultProps} {...props} />
