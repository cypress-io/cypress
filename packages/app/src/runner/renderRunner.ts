import $ from 'jquery'

export function renderRunner () {
  return $('head').append([
    $(`<script type="text/javascript" src="/__cypress/runner/cypress_runner.js"></script>`),
    $(`<link rel="stylesheet" href="/__cypress/runner/cypress_runner.css">`),
  ])
}
