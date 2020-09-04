import React from 'react'

const OtherComponent = React.lazy(() => import('./OtherComponent'))

export default () => {
  return (
    <div className="app">
      <OtherComponent />
    </div>
  )
}
