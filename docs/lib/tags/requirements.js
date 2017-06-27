module.exports = function yields (hexo, args) {
  // {% requirements parent cy.clearCookies %}
  // {% requirements blurability .blur %}
  // {% requirements focusability .blur %}
  // {% requirements checkability .click %}
  // {% requirements child_dom .click %}
  // {% requirements existence .children %}

  const type = args[0]
  const cmd = `<code>${args[1]}()</code>`

  const focus = `${cmd} requires the element to be able to receive focus`

  const parentCmd = `${cmd} requires being chained off of <code>cy</code>`
  const childCmd = `${cmd} requires being chained off a previous command`
  const childCmdDom = `${cmd} requires being chained off a command that yields DOM element(s)`
  const dualCmd = `${cmd} can be chained off of <code>cy</code> or off a command that yeilds DOM element(s)`

  const parentOrChild = () => {
    return (args[1] === 'cy.get' || args[1] === 'cy.focused') ? parentCmd : childCmdDom
  }

  const none = () => {
    return `<ul>
      <li><p>${cmd} has no requirements or default assertions.</p></li>
    </ul>`
  }

  const child = () => {
    return `<ul>
      <li><p>${childCmd}.</p></li>
    </ul>`
  }

  const childDom = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
    </ul>`
  }

  const parent = () => {
    return `<ul>
      <li><p>${parentCmd}.</p></li>
    </ul>`
  }

  const blurability = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
      <li><p>${cmd} requires the element to currently have focus.</p></li>
      <li><p>${focus}.</p></li>
    </ul>`
  }

  const focusability = () => {
    return `<ul>
      <li><p>${focus}.</p></li>
    </ul>`
  }

  const clearability = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
      <li><p>${cmd} requires the element to be an <code>input</code> or <code>textarea</code>.</p></li>
    </ul>`
  }

  const checkability = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
      <li><p>${cmd} requires the element to have type <code>checkbox</code> or <code>radio</code>.</p></li>
    </ul>`
  }

  const selectability = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
      <li><p>${cmd} requires the element to be a <code>select</code>.</p></li>
    </ul>`
  }

  const existence = () => {
    return `<ul>
      <li><p>${parentOrChild()}.</p></li>
    </ul>`
  }

  const exec = () => {
    return `<ul>
      <li><p>${cmd} requires the executed system command to eventually exit.</p></li>
      <li><p>${cmd} requires that the exit code be <code>0</code> when <code>failOnNonZeroExit</code> is <code>true</code>.</p></li>
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
    return `<ul>
      <li><p>${parentCmd}.</p></li>
      <li><p>${cmd} requires the response to be <code>content-type: text/html</code>.</p></li>
      <li><p>${cmd} requires the response code to be <code>2xx</code> after following redirects.</p></li>
      <li><p>${cmd} requires the load <code>load</code> event to eventually fire.</p></li>
    </ul>`
  }

  const tick = () => {
    return `<ul>
      <li><p>${cmd} requires that <code>cy.clock()</code> be called before it.</p></li>
    </ul>`
  }

  switch (type) {
    case 'none':
      return none()
    case 'parent':
      return parent()
    case 'child':
      return child()
    case 'child_dom':
      return childDom()
    case 'clearability':
      return clearability()
    case 'blurability':
      return blurability()
    case 'focusability':
      return focusability()
    case 'checkability':
      return checkability()
    case 'selectability':
      return selectability()
    case 'existence':
      return existence()
    case 'exec':
      return exec()
    case 'read_file':
      return readFile()
    case 'write_file':
      return writeFile()
    case 'page':
      return page()
    case 'tick':
      return tick()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% requirements %} tag helper was provided an invalid option: ${type}`)
  }
}
