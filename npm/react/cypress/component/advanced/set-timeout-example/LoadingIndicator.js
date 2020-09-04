import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class LoadingIndicator extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
  }

  state = {
    isPastDelay: false,
  }

  componentDidMount () {
    console.log('component did mount') // eslint-disable-line no-console
    this._delayTimer = setTimeout(() => {
      console.log('2000ms passed') // eslint-disable-line no-console
      this.setState({ isPastDelay: true })
    }, 2000)
  }

  componentWillUnmount () {
    console.log('componentWillUnmount') // eslint-disable-line no-console
    clearTimeout(this._delayTimer)
  }

  render () {
    if (this.props.isLoading) {
      if (!this.state.isPastDelay) {
        return null
      }

      return <div>loading...</div>
    }

    return this.props.children
  }
}
