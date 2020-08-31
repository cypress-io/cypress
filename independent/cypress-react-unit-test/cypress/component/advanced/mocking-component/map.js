import React from 'react'

import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'

const GMap = withScriptjs(
  withGoogleMap(props => <GoogleMap id="example-map" center={props.center} />),
)

export default function Map(props) {
  return (
    <GMap
      googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyC4R6AN7SmujjPUIGKdyao2Kqitzr1kiRg&v=3.exp&libraries=geometry,drawing,places"
      loadingElement={<div style={{ height: `100%` }} />}
      containerElement={<div style={{ height: `400px` }} />}
      mapElement={<div style={{ height: `100%` }} />}
    />
  )
}
