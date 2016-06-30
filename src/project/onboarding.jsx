import React, { Component } from 'react'
import BootstrapModal from 'react-bootstrap-modal'

class OnBoading extends Component {
  render () {
    if (!this.props.project.isNew) return null

    return (
      <BootstrapModal
        show={true}
        onHide={this._onHide}
        backdrop='static'>
        <div className='modal-body'>
          <div className='empty-onboarding'>
            <h1>To help you get started...</h1>
            <p>
              We've created a folder here:
              <strong data-js='cypress-folder'>
                <i className='fa fa-folder-o'></i>{' '}
                {this.props.project.parentTestsFolderDisplay}
              </strong>
            </p>
            <p>
              In there you'll find some sample tests:
              <strong data-js='example-file'>
                <i className='fa fa-file-code-o'></i>{' '}
                {this.props.project.integrationExampleName}
              </strong>
            </p>
            <hr />
            <p>
              We've also created
              <strong data-js='fixtures-folder'>
                <i className='fa fa-folder-o'></i>{' '}
                fixtures{' '}
              </strong>
              and
              <strong data-js='support-folder'>
                <i className='fa fa-folder-o'></i>{' '}
                support{' '}
              </strong>
              for you.
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
                                example_spec.js
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
}

export default OnBoading
