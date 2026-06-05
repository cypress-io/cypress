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

// Disabling pointer events removes the cursor from the hover chain, which
// clears any `:hover` styles that get applied when the app under test shifts
// underneath the mouse as the runner UI is hidden during a screenshot.
// https://github.com/cypress-io/cypress/issues/23300
function addCssPointerEventsDisabler ($body: JQuery<HTMLBodyElement>) {
  $(`
    <style id="__cypress-pointer-events-disabler">
      *, *:before, *:after {
        pointer-events: none !important;
      }
    </style>
  `).appendTo($body)
}

function removeCssPointerEventsDisabler ($body: JQuery<HTMLBodyElement>) {
  $body.find('#__cypress-pointer-events-disabler').remove()
}

export default {
  addCssAnimationDisabler,
  removeCssAnimationDisabler,
  addCssPointerEventsDisabler,
  removeCssPointerEventsDisabler,
}
