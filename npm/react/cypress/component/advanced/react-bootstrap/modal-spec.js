import React from 'react'
import { Button, Modal } from 'react-bootstrap'
import { mount } from 'cypress-react-unit-test'

export class Example extends React.Component {
  constructor(props, context) {
    super(props, context)

    this.handleShow = this.handleShow.bind(this)
    this.handleClose = this.handleClose.bind(this)

    this.state = {
      show: true,
    }
  }

  handleClose() {
    this.setState({ show: false })
  }

  handleShow() {
    this.setState({ show: true })
  }

  render() {
    return (
      <div>
        This text is all that renders. And the modal is not rendered, regardless
        of whether it is contained within this div.
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Text in a modal</h4>
            <p>
              Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
              dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta
              ac consectetur ac, vestibulum at eros.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleClose}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

describe('react-bootstrap Modal', () => {
  it('works', () => {
    mount(<Example />, {
      cssFile: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
    })
    // confirm modal is visible
    cy.contains('h4', 'Text in a modal').should('be.visible')
    cy.contains('button', 'Close').click()
    cy.contains('h4', 'Text in a modal').should('not.exist')
  })
})
