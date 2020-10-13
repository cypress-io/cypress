// https://medium.com/@pierrehedkvist/renderless-components-in-react-8d663746314c
import React from 'react'
import PropTypes from 'prop-types'

export default class MouseMovement extends React.Component {
  constructor(props) {
    console.log('MouseMovement constructor')
    super(props)
    this.state = {
      timer: undefined,
    }
    this.timeout = this.timeout.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
  }

  componentWillMount() {
    console.log('MouseMovement componentWillMount')
    document.addEventListener('mousemove', this.onMouseMove)
    const timer = setTimeout(this.timeout, 4000)
    this.setState({ timer })
  }

  componentWillUnmount() {
    console.log('MouseMovement componentWillUnmount')
    document.removeEventListener('mousemove', this.onMouseMove)
    clearTimeout(this.state.timer)
    this.setState({ timer: undefined })
  }

  onMouseMove() {
    console.log('MouseMovement onMouseMove')
    clearTimeout(this.state.timer)
    const timer = setTimeout(this.timeout, 4000)
    this.setState({ timer })
    this.props.onMoved(true)
  }

  timeout() {
    console.log('timeout')
    clearTimeout(this.state.timer)
    this.props.onMoved(false)
  }
  render() {
    return null
  }
}

MouseMovement.propTypes = {
  onMoved: PropTypes.func.isRequired,
}
