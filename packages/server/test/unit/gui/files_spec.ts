import '../../spec_helper'

import { expect } from 'chai'
import 'sinon-chai'

import { showDialogAndCreateSpec } from '../../../lib/gui/files'
//@ts-ignore
import openProject from '../../../lib/open_project'
import { ProjectE2E } from '../../../lib/project-e2e'
import * as dialog from '../../../lib/gui/dialog'
import * as specWriter from '../../../lib/util/spec_writer'

describe('gui/files', () => {
  context('.showDialogAndCreateSpec', () => {
    beforeEach(function () {
      this.integrationFolder = '/path/to/project/cypress/integration'
      this.selectedPath = `${this.integrationFolder}/my_new_spec.js`

      this.config = {
        integrationFolder: this.integrationFolder,
        some: 'config',
      }

      this.specs = {
        integration: [
          {
            name: 'app_spec.js',
            absolute: '/path/to/project/cypress/integration/app_spec.js',
            relative: 'cypress/integration/app_spec.js',
          },
        ],
      }

      this.err = new Error('foo')

      sinon.stub(ProjectE2E.prototype, 'open').resolves()
      sinon.stub(ProjectE2E.prototype, 'getConfig').resolves(this.config)

      this.showSaveDialog = sinon.stub(dialog, 'showSaveDialog').resolves(this.selectedPath)
      this.createFile = sinon.stub(specWriter, 'createFile').resolves({})
      this.getSpecs = sinon.stub(openProject, 'getSpecs').resolves(this.specs)

      return openProject.create('/_test-output/path/to/project-e2e')
    })

    it('calls dialog.showSaveDialog with integration folder from config', function () {
      return showDialogAndCreateSpec().then(() => {
        expect(this.showSaveDialog).to.be.calledWith(this.integrationFolder)
      })
    })

    it('calls specWriter.createFile with path selected from dialog', function () {
      return showDialogAndCreateSpec().then(() => {
        expect(this.createFile).to.be.calledWith(this.selectedPath)
      })
    })

    it('does not call specWriter.createFile when no file is selected', function () {
      this.showSaveDialog.resolves(null)

      return showDialogAndCreateSpec().then(() => {
        expect(this.createFile).not.to.be.called
      })
    })

    it('calls openProject.getSpecs with config and resolves specs and new file path', function () {
      return showDialogAndCreateSpec().then((response) => {
        expect(this.getSpecs).to.be.called

        expect(response.specs).to.equal(this.specs)
        expect(response.path).to.equal(this.selectedPath)
      })
    })

    it('does not call openProject.getSpecs when no file is selected and sends nulls', function () {
      this.showSaveDialog.resolves(null)

      return showDialogAndCreateSpec().then((response) => {
        expect(this.getSpecs).not.to.be.called

        expect(response.specs).to.be.null
        expect(response.path).to.be.null
      })
    })
  })
})
