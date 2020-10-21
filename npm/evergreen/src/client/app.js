import $ from 'cash-dom'
import './assets/styles.scss'

export function createApp(specNames, { runAllSpecs }) {
  const $app = $(`<section id="evergreen"><hr/><h2>Spec Files</h2></section>`)

  const $nav = $(`<nav>
    ${ specNames.map(s => `<p>${s}</p>`).join('') }
  </nav>`)

  $app.append($nav)
  $app.append($(`<button>Run All</button>`).on('click', runAllSpecs))
  $app.append($(`<hr />`))

  $('body').append($app)
}
