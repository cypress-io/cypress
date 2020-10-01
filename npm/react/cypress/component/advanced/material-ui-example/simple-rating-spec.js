/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
// select example from
// https://material-ui.com/components/rating/

import React from 'react'
import Rating from '@material-ui/lab/Rating'
import Typography from '@material-ui/core/Typography'
import Box from '@material-ui/core/Box'
import { ExpansionPanelActions } from '@material-ui/core'

export default function SimpleRating({ onSetRating }) {
  const [value, setValue] = React.useState(2)

  return (
    <div>
      <Box component="fieldset" mb={3} borderColor="transparent">
        <Typography component="legend">Controlled</Typography>
        <Rating
          name="simple-controlled"
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue)
            console.log('new value', newValue)
            if (onSetRating) {
              onSetRating(newValue)
            }
          }}
        />
      </Box>
      <Box component="fieldset" mb={3} borderColor="transparent">
        <Typography component="legend">Read only</Typography>
        <Rating name="read-only" value={value} readOnly />
      </Box>
      <Box component="fieldset" mb={3} borderColor="transparent">
        <Typography component="legend">Disabled</Typography>
        <Rating name="disabled" value={value} disabled />
      </Box>
      <Box component="fieldset" mb={3} borderColor="transparent">
        <Typography component="legend">Pristine</Typography>
        <Rating name="pristine" value={null} />
      </Box>
    </div>
  )
}

it('renders simple rating', () => {
  cy.viewport(300, 400)
  const onSetRating = cy.stub()
  mount(<SimpleRating onSetRating={onSetRating} />, {
    stylesheets: [
      'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
      'https://fonts.googleapis.com/icon?family=Material+Icons',
    ],
  })
  cy.get('label[for=simple-controlled-4]')
    .click()
    .then(() => {
      expect(onSetRating).to.have.been.calledWith(4)
    })
})
