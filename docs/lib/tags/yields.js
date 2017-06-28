const rawRender = require('../raw_render')

module.exports = function yields (hexo, args) {
  // {% yields same_subject .click %}
  // {% yields changes_subject .invoke 'yields the return value' %}
  // {% yields maybe_changes_subject .then 'yields the return value' %}
  // {% yields changes_dom_subject .children %}
  // {% yields sets_dom_subject .get %}
  // {% yields sets_subject cy.readFile 'yields the contents of the file' %}
  // {% yields null cy.clearCookies %}
  // {% yields assertion_indeterminate .should %}

  const type = args[0]
  const cmd = `<code>${args[1]}()</code>`
  const arg = args[2]

  const render = (str) => {
    return rawRender.call(this, hexo, str, { engine: 'markdown' })
    .then((html) => {
      return html.replace('<p>', '').replace('</p>', '').replace('\n', '')
    })
  }

  const assertion = () => {
    return `In most cases, ${cmd} yields the same subject it was given from the previous command.`
  }

  const sameSubject = () => {
    return `<ul>
      <li><p>${cmd} yields the same subject it was given from the previous command.</p></li>
    </ul>`
  }

  const changesSubject = () => {
    return render(arg)
    .then((html) => {
      return `<ul>
        <li><p>${cmd} ${html}.</p></li>
      </ul>`
    })
  }

  const maybeChangesSubject = () => {
    return render(arg)
    .then((html) => {
      return `<ul>
        <li><p>${cmd} ${html}.</p></li>
        <li><p>${cmd} will not change the subject if <code>null</code> or <code>undefined</code> is returned.</p></li>
      </ul>`
    })
  }

  const setsSubject = () => {
    return render(arg)
    .then((html) => {
      return `<ul>
        <li><p>${cmd} ${html}.</p></li>
      </ul>`
    })
  }

  const changesDomSubject = () => {
    return `<ul>
      <li><p>${cmd} yields the new DOM element(s) it found.</p></li>
    </ul>`
  }

  const setsDomSubject = () => {
    return `<ul>
      <li><p>${cmd} yields the DOM element(s) it found.</p></li>
    </ul>`
  }

  const _null = () => {
    return `<ul>
      <li><p>${cmd} yields <code>null</code>.</p></li>
      <li><p>${cmd} cannot be chained further.</p></li>
    </ul>`
  }

  const nullAlias = () => {
    return `<ul>
      <li><p>${cmd} yields <code>null</code>.</p></li>
      <li><p>${cmd} can but aliased but otherwise cannot be chained further.</p></li>
    </ul>`
  }

  switch (type) {
    case 'same_subject':
      return sameSubject()
    case 'changes_subject':
      return changesSubject()
    case 'maybe_changes_subject':
      return maybeChangesSubject()
    case 'changes_dom_subject':
      return changesDomSubject()
    case 'sets_dom_subject':
      return setsDomSubject()
    case 'sets_subject':
      return setsSubject()
    case 'null':
      return _null()
    case 'null_alias':
      return nullAlias()
    case 'assertion_indeterminate':
      return assertion()
    default:
      // error when an invalid usage option was provided
      throw new Error(`{% yields %} tag helper was provided an invalid option: ${type}`)
  }
}
