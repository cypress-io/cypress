import React, { Component } from 'react'

export default class SpecIframe extends Component {
  componentDidMount () {
    const iframe = this.refs.iframe
    const onLoad = () => {
      this.props.onLoaded(iframe.contentWindow)

      iframe.removeEventListener('load', onLoad)
    }
    iframe.addEventListener('load', onLoad)
  }

  shouldComponentUpdate () {
    return false
  }

  render () {
    const src = 'test.html'

    return <iframe ref="iframe" id={`Your Spec: '${src}'`} className='iframe-spec' src={src} />
  }
}
