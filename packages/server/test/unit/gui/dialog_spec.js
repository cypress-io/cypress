/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('../../spec_helper')

const electron = require('electron')
const dialog = require(`${root}../lib/gui/dialog`)
const Windows = require(`${root}../lib/gui/windows`)

describe('gui/dialog', () => {
  context('.show', () => {
    beforeEach(function () {
      this.showOpenDialog = (electron.dialog.showOpenDialog = sinon.stub().resolves({
        filePaths: [],
      }))
    })

    it('calls dialog.showOpenDialog with args', function () {
      dialog.show()

      expect(this.showOpenDialog).to.be.calledWith({
        properties: ['openDirectory'],
      })
    })

    it('resolves with first path', function () {
      this.showOpenDialog.resolves({
        filePaths: ['foo', 'bar'],
      })

      return dialog.show().then((ret) => {
        expect(ret).to.eq('foo')
      })
    })

    it('handles null paths', function () {
      this.showOpenDialog.resolves({
        filePaths: null,
      })

      return dialog.show().then((ret) => {
        expect(ret).to.eq(undefined)
      })
    })

    it('handles null obj', function () {
      this.showOpenDialog.resolves(null)

      return dialog.show().then((ret) => {
        expect(ret).to.eq(undefined)
      })
    })
  })
})
