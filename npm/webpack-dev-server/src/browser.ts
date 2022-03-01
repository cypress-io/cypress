function render () {
  require(`!!./loader.js!./browser.js?${(new Date()).getTime()}`)
}

render()
