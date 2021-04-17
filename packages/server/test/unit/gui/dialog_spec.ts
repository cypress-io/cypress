import '../../spec_helper'

import { expect } from 'chai'
import 'sinon-chai'

import { dialog } from 'electron'
import * as path from 'path'

import { show, showSaveDialog } from '../../../lib/gui/dialog'
import * as windows from '../../../lib/gui/windows'

describe('gui/dialog', () => {
  context('.show', () => {
    beforeEach(function () {
      this.showOpenDialog = (dialog.showOpenDialog = sinon.stub().resolves({
        filePaths: [],
      }))
    })

    it('calls dialog.showOpenDialog with args', function () {
      show()

      expect(this.showOpenDialog).to.be.calledWith({
        properties: ['openDirectory'],
      })
    })

    it('resolves with first path', function () {
      this.showOpenDialog.resolves({
        filePaths: ['foo', 'bar'],
      })

      return show().then((ret) => {
        expect(ret).to.eq('foo')
      })
    })

    it('handles null paths', function () {
      this.showOpenDialog.resolves({
        filePaths: null,
      })

      return show().then((ret) => {
        expect(ret).to.eq(undefined)
      })
    })

    it('handles null obj', function () {
      this.showOpenDialog.resolves(null)

      return show().then((ret) => {
        expect(ret).to.eq(undefined)
      })
    })
  })

  context('.showSaveDialog', () => {
    beforeEach(function () {
      this.electronShowSaveDialog = (dialog.showSaveDialog = sinon.stub().resolves({
        canceled: true,
        filePath: '',
      }))

      this.integrationFolder = '/path/to/project/cypress/integration'

      sinon.stub(windows, 'get').returns({})
    })

    it('attaches dialog to current window', function () {
      showSaveDialog(this.integrationFolder)

      expect(windows.get).to.be.called
    })

    it('sets default path to untitled.spec.js in integration folder', function () {
      showSaveDialog(this.integrationFolder)

      expect(this.electronShowSaveDialog).to.be.calledWithMatch({}, {
        defaultPath: path.join(this.integrationFolder, 'untitled.spec.js'),
      })
    })

    it('resolves null when canceled', function () {
      return showSaveDialog(this.integrationFolder).then((ret) => {
        expect(ret).to.be.null
      })
    })

    it('resolves with chosen file path', function () {
      const filePath = path.join(this.integrationFolder, 'my_new_spec.js')

      this.electronShowSaveDialog.resolves({
        canceled: false,
        filePath,
      })

      return showSaveDialog(this.integrationFolder).then((ret) => {
        expect(ret).to.equal(filePath)
      })
    })
  })
})
