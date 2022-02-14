import $ from 'jquery'

function addCssAnimationDisabler ($body) {
  $(`
    <style id="__cypress-animation-disabler">
      *, *:before, *:after {
        transition-property: none !important;
        animation: none !important;
      }
    </style>
  `).appendTo($body)
}

function removeCssAnimationDisabler ($body) {
  $body.find('#__cypress-animation-disabler').remove()
}

export default {
  addCssAnimationDisabler,
  removeCssAnimationDisabler,
}
