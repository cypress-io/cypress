import './test-entry.scss'
import '../../src/browser-icon' // ensures browser icon images load

// @ts-ignore
window.renderComponent = (r) => r(document.getElementById('app'))
