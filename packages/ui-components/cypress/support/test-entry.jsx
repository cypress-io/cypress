import './test-entry.scss'
import '../../src/browser-icon' // ensures browser icon images load

window.renderComponent = (r) => r(document.getElementById('app'))
