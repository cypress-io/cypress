import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { error: null, info: '' }
  }

  static getDerivedStateFromError (error) {
    console.error(error)

    return { error }
  }

  componentDidCatch (error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error,
      info: errorInfo,
    })
    // You can also log error messages to an error reporting service here
  }

  render () {
    const { name } = this.props
    const { error } = this.state

    if (error) {
      return (
        <React.Fragment>
          <header>
            <h1>Something went wrong.</h1>
            <h3>{`${name} failed to load`}</h3>
          </header>
          <section>
            <pre>
              <code>{JSON.stringify(error)}</code>
            </pre>
          </section>
        </React.Fragment>
      )
    }

    return this.props.children
  }
}
