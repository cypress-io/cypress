import $ from 'jquery'

function addCssAnimationDisabler ($body: JQuery<HTMLBodyElement>) {
  $(`
    <style id="__cypress-animation-disabler">
      *, *:before, *:after {
        transition-property: none !important;
        animation: none !important;
      }
    </style>
  `).appendTo($body)
}

function removeCssAnimationDisabler ($body: JQuery<HTMLBodyElement>) {
  $body.find('#__cypress-animation-disabler').remove()
}

export default {
  addCssAnimationDisabler,
  removeCssAnimationDisabler,
}
