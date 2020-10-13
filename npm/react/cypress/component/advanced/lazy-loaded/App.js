import React from 'react'

const OtherComponent = React.lazy(() => import('./OtherComponent'))

export default App = () => (
  <div className="app">
    <OtherComponent />
  </div>
)
