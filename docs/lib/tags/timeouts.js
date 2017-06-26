const rawRender = require('../raw_render')

/* eslint-disable quotes */
const urls = {
  action: `{% url 'actionable state' interacting-with-elements %}`,
  exist: `{% url 'found in the dom' introduction-to-cypress#Default-Assertions %}`,
}

module.exports = function yields (hexo, args) {
  // {% timeouts assertions .blur %}
  // {% timeouts actionability .check %}
  // {% timeouts existence cy.get %}
  // {% timeouts automation cy.clearCookie %}
  // {% timeouts none .debug %}

  const type = args[0]
  const cmd = `<code>${args[1]}()</code>`

  const assertion = `${cmd} can time out waiting for any assertion's you've added to pass`

  const render = (str) => {
    return rawRender.call(this, hexo, str)
  }

  const assertions = () => {
    return `<ul>
      <li><p>${assertion}.</p></li>
    </ul>`
  }

  const actionability = () => {
    return render(`<ul>
      <li><p>${cmd} can time out waiting for the element to reach an ${urls.action}.</p></li>
      <li><p>${assertion}.</p></li>
    </ul>`)
  }

  const existence = () => {
    return render(`<ul>
      <li><p>${cmd} can time out waiting for the element to be ${urls.exist}.</p></li>
      <li><p>${assertion}.</p></li>
    </ul>`)
  }

  const automation = () => {
    return render(`<ul>
      <li><p>${cmd} should never time out.</p></li>
      </ul>
      {% note warning %}
      Because ${cmd} is asynchronous it is technically possible for there to be a time out while talking to the internal Cypress automation API's. But for practical purposes it should never happen.
      {% endnote %}`)
  }

  const exec = () => {
    return `<ul>
      <li><p>${cmd} can time out waiting for the system command to exit.</p></li>
    </ul>`
  }

  const none = () => {
    return `<ul>
      <li><p>${cmd} can not time out, nor can you add any assertions.</p></li>
    </ul>`
  }

  switch (type) {
    case 'assertions':
      return assertions()
    case 'actionability':
      return actionability()
    case 'existence':
      return existence()
    case 'automation':
      return automation()
    case 'exec':
      return exec()
    case 'none':
      return none()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% timeouts %} tag helper was provided an invalid option: ${type}`)
  }
}
