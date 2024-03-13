/*
 * Forked from TodoMVC
 * https://todomvc.com
 *
 * MIT License © Addy Osmani, Sindre Sorhus, Pascal Hartig, Stephen Sawchuk
 */

/*global app, $on */
(function () {
  'use strict'

  /**
   * Sets up a brand new Todo list.
   *
   * @param {string} name The name of your new to do list.
   */
  function Todo (name) {
    this.storage = new app.Store(name)
    this.model = new app.Model(this.storage)
    this.template = new app.Template()
    this.view = new app.View(this.template)
    this.controller = new app.Controller(this.model, this.view)
  }

  let todo = new Todo('todos-vanillajs')

  function init () {
    setView()

    // initialize with 2 items
    todo.storage.findAll((data) => {
      if (!data.length) {
        todo.controller.addItem('Pay electric bill')
        todo.controller.addItem('Walk the dog')
      }
    })
  }

  function setView () {
    todo.controller.setView(document.location.hash)
  }
  $on(window, 'load', init)
  $on(window, 'hashchange', setView)
})()
