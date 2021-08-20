import React from 'react'
import ReactDOM from 'react-dom'

export async function renderReact (target = document.getElementById('root')) {
  const ReactApp = (await import('./App')).default // Styles only load when the method is called.

  return ReactDOM.render(
    <React.StrictMode>
      <ReactApp />
    </React.StrictMode>,
    target,
  )
}
