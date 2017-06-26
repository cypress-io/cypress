const rawRender = require('../raw_render')

module.exports = function yields (hexo, args) {
  // {% requirements none cy.clearCookies %}
  // {% requirements blurability .blur %}
  // {% requirements focusability .blur %}
  // {% requirements checkability .click %}
  // {% requirements actionability .click %}
  // {% requirements existence .children %}

  const type = args[0]
  const cmd = `<code>${args[1]}()</code>`

  /* eslint-disable quotes */
  const actionable = `${cmd} requires the element to be in an {% url 'actionable state' interacting-with-elements %}`

  /* eslint-disable quotes */
  const exist = `${cmd} requires the element(s) to be {% url 'found in the dom' introduction-to-cypress#Default-Assertions %}`

  const focus = `${cmd} requires the element to be able to receive focus`

  const render = (str) => {
    return rawRender.call(this, hexo, str)
  }

  const none = () => {
    return `<ul>
      <li><p>${cmd} has no requirements or default assertions.</p></li>
    </ul>`
  }

  const actionability = () => {
    return render(`<ul>
      <li><p>${actionable}.</p></li>
    </ul>`)
  }

  const blurability = () => {
    return `<ul>
      <li><p>${cmd} requires the element to currently have focus.</p></li>
      <li><p>${focus}.</p></li>
    </ul>`
  }

  const focusability = () => {
    return `<ul>
      <li><p>${focus}.</p></li>
    </ul>`
  }

  const checkability = () => {
    return render(`<ul>
      <li><p>${cmd} requires the element to have type <code>checkbox</code> or <code>radio</code>.</p></li>
      <li><p>${actionable}.</p></li>
    </ul>`)
  }

  const existence = () => {
    return render(`<ul>
      <li><p>${exist}.</p></li>
    </ul>`)
  }

  const exec = () => {
    return render(`<ul>
      <li><p>${cmd} requires the executed system command to eventually exit.</p></li>
    </ul>`)
  }

  const execCode = () => {
    return `<ul>
      <li><p>${cmd} requires that the exit code be <code>0</code>.</p></li>
    </ul>`
  }

  const writeFile = () => {
    return `<ul>
      <li><p>${cmd} requires the file be successfully written to disk. Anything preventing this such as OS permission issues will cause it to fail.</p></li>
    </ul>`
  }

  const readFile = () => {
    return `<ul>
      <li><p>${cmd} requires the file must exist.</p></li>
      <li><p>${cmd} requires the file be successfully read from disk. Anything preventing this such as OS permission issues will cause it to fail.</p></li>
    </ul>`
  }

  const page = () => {
    return render(`<ul>
      <li><p>${cmd} requires the response to be <code>content-type: text/html</code>.</p></li>
      <li><p>${cmd} requires the response code to be <code>2xx</code> after following redirects.</p></li>
      <li><p>${cmd} requires the load <code>load</code> event to eventually fire.</p></li>
      <li><p>${actionable}.</p></li>
    </ul>`)
  }

  switch (type) {
    case 'none':
      return none()
    case 'actionability':
      return actionability()
    case 'blurability':
      return blurability()
    case 'focusability':
      return focusability()
    case 'checkability':
      return checkability()
    case 'existence':
      return existence()
    case 'exec':
      return exec()
    case 'exec_code':
      return execCode()
    case 'read_file':
      return readFile()
    case 'write_file':
      return writeFile()
    case 'page':
      return page()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% requirements %} tag helper was provided an invalid option: ${type}`)
  }
}
