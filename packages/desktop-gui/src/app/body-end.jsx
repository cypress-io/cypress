import React from 'react'
import ReactDOM from 'react-dom'

export default class BodyEnd extends React.Component {
  constructor (props) {
    super(props)
    this.el = document.createElement('div')
    this.el.style.display = 'contents' // The <div> is a necessary container for our content, but it should not affect our layout. Only works in some browsers, but generally doesn't matter since this is at the end anyway. Feel free to delete this line.
  }

  componentDidMount () {
    document.body.appendChild(this.el)
  }

  componentWillUnmount () {
    document.body.removeChild(this.el)
  }

  render () {
    return ReactDOM.createPortal(
      this.props.children,
      this.el,
    )
  }
}
