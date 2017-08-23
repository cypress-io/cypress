module.exports = function yields (hexo, args) {
  // {% requirements parent cy.clearCookies %}
  // {% requirements blurability .blur %}
  // {% requirements focusability .blur %}
  // {% requirements checkability .click %}
  // {% requirements dom .click %}
  // {% requirements dom .children %}

  const type = args[0]
  const cmd = `<code>${args[1]}()</code>`

  const focus = `${cmd} requires the element to be able to receive focus`

  const parentCmd = `${cmd} requires being chained off of <code>cy</code>`
  const childCmd = `${cmd} requires being chained off a previous command`
  const childCmdDom = `${cmd} requires being chained off a command that yields DOM element(s)`

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

  const dom = () => {
    return `<ul>
      <li><p>${parentOrChild()}.</p></li>
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
      <li><p>${childCmdDom}.</p></li>
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

  const scrollability = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
      <li><p>${cmd} requires the element to be scrollable.</p></li>
    </ul>`
  }

  const submitability = () => {
    return `<ul>
      <li><p>${childCmdDom}.</p></li>
      <li><p>${cmd} requires the element to be a <code>form</code>.</p></li>
    </ul>`
  }

  const dual = () => {
    return `<ul>
      <li><p>${cmd} can be chained off of <code>cy</code> or off another command.</p></li>
    </ul>`
  }

  const dualExistence = () => {
    return `<ul>
      <li><p>${cmd} can be chained off of <code>cy</code> or off a command that yields DOM element(s).</p></li>
    </ul>`
  }

  const spread = () => {
    return `<ul>
      <li><p>${childCmd}.</p></li>
      <li><p>${cmd} requires being chained off of a command that yields an array-like structure.</p></li>
    </ul>`
  }

  const exec = () => {
    return `<ul>
      <li><p>${parentCmd}.</p></li>
      <li><p>${cmd} requires the executed system command to eventually exit.</p></li>
      <li><p>${cmd} requires that the exit code be <code>0</code> when <code>failOnNonZeroExit</code> is <code>true</code>.</p></li>
    </ul>`
  }

  const writeFile = () => {
    return `<ul>
      <li><p>${parentCmd}.</p></li>
      <li><p>${cmd} requires the file be successfully written to disk. Anything preventing this such as OS permission issues will cause it to fail.</p></li>
    </ul>`
  }

  const readFile = () => {
    return `<ul>
      <li><p>${parentCmd}.</p></li>
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
      <li><p>${parentCmd}.</p></li>
      <li><p>${cmd} requires that <code>cy.clock()</code> be called before it.</p></li>
    </ul>`
  }

  const request = () => {
    return `<ul>
      <li><p>${parentCmd}.</p></li>
      <li><p>${cmd} requires that the server send a response.</p></li>
      <li><p>${cmd} requires that the response status code be <code>2xx</code> or <code>3xx</code> when <code>failOnStatusCode</code> is <code>true</code>.</p></li>
    </ul>`
  }

  switch (type) {
    case 'none':
      return none()
    case 'parent':
      return parent()
    case 'child':
      return child()
    case 'dom':
      return dom()
    case 'dual':
      return dual()
    case 'dual_existence':
      return dualExistence()
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
    case 'scrollability':
      return scrollability()
    case 'submitability':
      return submitability()
    case 'spread':
      return spread()
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
    case 'request':
      return request()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% requirements %} tag helper was provided an invalid option: ${type}`)
  }
}
