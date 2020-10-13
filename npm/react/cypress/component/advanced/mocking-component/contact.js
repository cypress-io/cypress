// example from https://reactjs.org/docs/testing-recipes.html#mocking-modules
import React from 'react'
import Map from './map'

export default function Contact(props) {
  return (
    <div>
      <address>
        Contact {props.name} via{' '}
        <a data-testid="email" href={'mailto:' + props.email}>
          email
        </a>{' '}
        or on their{' '}
        <a data-testid="site" href={props.site}>
          website
        </a>
        .
      </address>
      <Map center={props.center} />
    </div>
  )
}
