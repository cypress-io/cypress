import React from 'react'

interface ErrorBoundaryProps {
  name?: string
  children?: React.ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
  info: React.ErrorInfo | string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor (props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null, info: '' }
  }

  static getDerivedStateFromError (error: Error) {
    console.error(error)

    return { error }
  }

  componentDidCatch (error: Error, errorInfo: React.ErrorInfo) {
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
            <h2>{`${name} failed to load`}</h2>
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
