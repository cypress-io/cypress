import $ from 'cash-dom'

function appendTargetIfNotExists (id, tag = 'div', parent = document.body) {
  let node = document.getElementById(id)

  if (!node) {
    node = document.createElement(tag)
    node.setAttribute('id', id)
    parent.appendChild(node)
  }

  node.innerHTML = ''

  return node
}

/** Renders the app's target structure **
 *  The mocha div is the container for the reporter <div id="mocha" />
 *  The Evergreen AUT will be re-created between runs
 *  The Root container div will be replaced when mount is called
 */
export function renderTargets () {
  const containerEl = appendTargetIfNotExists('evergreen-aut')

  appendTargetIfNotExists('root', 'div', containerEl)
}

export function renderMochaTarget () {
  const $mocha = $('#mocha')
  const $testRun = $('#test-run')

  if ($mocha.length) $mocha[0].innerHTML = ''

  if ($testRun.length) {
    return
  }

  $('#plugins').append(`<section id="test-run">
    <h2>Test Run</h2>
    <div id="mocha"></div>
    </section>`)
}
