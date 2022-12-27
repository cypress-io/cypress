import { handleInvalidTarget } from '../../cy/top_attr_guards'

export const patchFormElementSubmit = (window: Window) => {
  const originalSubmit = window.HTMLFormElement.prototype.submit

  window.HTMLFormElement.prototype.submit = function () {
    handleInvalidTarget(this)
    originalSubmit.apply(this)
  }
}
