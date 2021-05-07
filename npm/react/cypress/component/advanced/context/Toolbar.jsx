import React from 'react'
import { ThemeContext } from './context'

// A component in the middle doesn't have to
// pass the theme down explicitly anymore.
export function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  )
}

function Button(props) {
  return <button>{props.theme}</button>
}

class ThemedButton extends React.Component {
  // Assign a contextType to read the current theme context.
  // React will find the closest theme Provider above and use its value.
  // In this example, the current theme is "dark".
  static contextType = ThemeContext
  render() {
    return <Button theme={this.context} />
  }
}
