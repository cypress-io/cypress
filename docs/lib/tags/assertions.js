const rawRender = require('../raw_render')

module.exports = function yields (hexo, args) {
  // {% requirements parent cy.clearCookies %}
  // {% requirements blurability .blur %}
  // {% requirements focusability .blur %}
  // {% requirements checkability .click %}
  // {% requirements child_dom .click %}
  // {% requirements existence .children %}

  const type = args[0]
  const cmd = `<code>${args[1]}()</code>`

  /* eslint-disable commas */
  const waitAssertions = `${cmd} will automatically wait for assertions you've added to pass`

  /* eslint-disable commas */
  const retryAssertions = `${cmd} will automatically retry itself until assertions you've added all pass`

  /* eslint-disable quotes */
  const exist = `${cmd} will automatically retry itself until the element(s) {% url 'exist in the DOM' introduction-to-cypress#Default-Assertions %}`

  /* eslint-disable quotes */
  const actionable = `${cmd} will automatically wait for the element to reach an {% url 'actionable state' interacting-with-elements %}`

  const render = (str) => {
    return rawRender.call(this, hexo, str)
  }

  const none = () => {
    return `<ul>
      <li><p>${cmd} cannot have any assertions added.</p></li>
    </ul>`
  }

  const wait = () => {
    return `<ul>
      <li><p>${waitAssertions}.</p></li>
    </ul>`
  }

  const retry = () => {
    return `<ul>
      <li><p>${retryAssertions}.</p></li>
    </ul>`
  }

  const once = () => {
    return `<ul>
      <li><p>${cmd} will only run assertions you've added once, and will not retry.</p></li>
    </ul>`
  }

  const its = () => {
    return `<ul>
      <li><p>${cmd} will automatically retry itself until the property exists on the subject.</p></li>
      <li><p>${retryAssertions}.</p></li>
    </ul>`
  }

  const existence = () => {
    return render(`<ul>
      <li><p>${exist}.</p></li>
      <li><p>${retryAssertions}.</p></li>
    </ul>`)
  }

  const actions = () => {
    return render(`<ul>
      <li><p>${actionable}.</p></li>
      <li><p>${waitAssertions}.</p></li>
    </ul>`)
  }

  switch (type) {
    case 'none':
      return none()
    case 'once':
      return once()
    case 'wait':
      return wait()
    case 'retry':
      return retry()
    case 'its':
      return its()
    case 'existence':
      return existence()
    case 'actions':
      return actions()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% assertions %} tag helper was provided an invalid option: ${type}`)
  }
}
