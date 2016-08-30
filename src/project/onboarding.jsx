import React, { Component } from 'react'
import { observer } from 'mobx-react'
import BootstrapModal from 'react-bootstrap-modal'

import App from '../lib/app'

@observer
class OnBoading extends Component {
  constructor (props) {
    super(props)

    if (this.props.project.isNew) {
      this.props.project.openModal()
    }
  }

  render () {
    let closeModal = () => {
      this.props.project.closeModal()
    }

    return (
      <BootstrapModal
        show={this.props.project.onBoardingModalOpen}
        onHide={closeModal}
        backdrop='static'
        >
        <div className='modal-body'>
          <div className='empty-onboarding'>
            <h1>To help you get started...</h1>
            <p>
              We've added some folders and example tests to your project. Try running the
              <strong onClick={this._openExampleSpec.bind(this)}>
                <i className='fa fa-file-code-o'></i>{' '}
                { this.props.project.integrationExampleName }{' '}
              </strong>
              tests or add your own test file to
              <strong onClick={this._openIntegrationFolder.bind(this)}>
                <i className='fa fa-folder-o'></i>{' '}
                cypress/integration
              </strong>.
            </p>
            <div className='folder-preview-onboarding'>
              <ul>
                <li>
                  <span>
                    <i className='fa fa-folder-open-o'></i>{' '}
                    {this.props.project.name}
                  </span>
                  <ul>
                    <li className='app-code'>
                      <span >
                        <i className='fa fa-folder-o'></i>{' '}
                        ...
                      </span>
                    </li>
                    <li className='new-code'>
                      <span>
                        <i className='fa fa-folder-open-o'></i>{' '}
                        cypress
                      </span>
                      <ul>
                        <li>
                          <span>
                            <i className='fa fa-folder-o'></i>{' '}
                            fixtures
                          </span>
                        </li>
                        <li>
                          <span>
                            <i className='fa fa-folder-open-o'></i>{' '}
                            integration
                          </span>
                          <ul>
                            <li>
                              <span>
                                <i className='fa fa-file-code-o'></i>{' '}
                                { this.props.project.integrationExampleName }
                              </span>
                            </li>
                          </ul>
                        </li>
                        <li>
                          <span>
                            <i className='fa fa-folder-o'></i>{' '}
                            support
                          </span>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className='helper-line'>
              <BootstrapModal.Dismiss className='btn btn-success'>
                OK, got it!
              </BootstrapModal.Dismiss>
            </div>
          </div>
        </div>
      </BootstrapModal>
    )
  }

  _openExampleSpec () {
    App.ipc('open:finder', this.props.project.integrationExampleFile)
  }

  _openIntegrationFolder () {
    App.ipc('open:finder', this.props.project.integrationFolder)
  }
}

export default OnBoading
