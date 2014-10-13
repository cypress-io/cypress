## attach to Eclectus global

window.html = {
  head: """
    <meta charset="utf-8">
    <title>Marionette • TodoMVC</title>
    <link rel="stylesheet" href="bower_components/todomvc-common/base.css">
    <link rel="stylesheet" href="css/app.css">
  """
  body: """
    <section id="todoapp">
      <header id="header"></header>
      <section id="main"></section>
      <footer id="footer"></footer>
    </section>
    <footer id="info">
      <p>Double-click to edit a todo</p>
      <p>
        Created by <a href="http://github.com/jsoverson">Jarrod Overson</a>
        and <a href="http://github.com/derickbailey">Derick Bailey</a>
        using <a href="http://marionettejs.com">Backbone.Marionette</a>
      </p>
      <p>Further variations on the Backbone.Marionette app are also <a href="https://github.com/marionettejs/backbone.marionette/wiki/Projects-and-websites-using-marionette">available</a>.</p>
    </footer>
    <script type="text/html" id="template-footer">
      <span id="todo-count">
        <strong><%= activeCount %></strong> <%= activeCountLabel() %>
      </span>
      <ul id="filters">
        <li class="all">
          <a href="#/">All</a>
        </li>
        <li class="active">
          <a href="#/active">Active</a>
        </li>
        <li class="completed">
          <a href="#/completed">Completed</a>
        </li>
      </ul>
      <button id="clear-completed" <% if (!completedCount) { %>class="hidden"<% } %>>
        Clear completed (<%= completedCount %>)
      </button>
    </script>
    <script type="text/html" id="template-header">
      <h1>todos</h1>
      <input id="new-todo" placeholder="What needs to be done?" autofocus>
    </script>
    <script type="text/html" id="template-todoItemView">
      <div class="view">
        <input class="toggle" type="checkbox" <% if (completed) { %>checked<% } %>>
        <label><%- title %></label>
        <button class="destroy"></button>
      </div>
      <input class="edit" value="<%- title %>">
    </script>
    <script type="text/html" id="template-todoListCompositeView">
      <input id="toggle-all" type="checkbox">
      <label for="toggle-all">Mark all as complete</label>
      <ul id="todo-list"></ul>
    </script>
    <!-- vendor libraries -->
    <script src="bower_components/todomvc-common/base.js"></script>
    <script src="bower_components/jquery/jquery.js"></script>
    <script src="bower_components/underscore/underscore.js"></script>
    <script src="bower_components/backbone/backbone.js"></script>
    <script src="bower_components/backbone.localStorage/backbone.localStorage.js"></script>
    <script src="bower_components/backbone.marionette/lib/backbone.marionette.js"></script>
    <!-- application -->
    <script src="js/TodoMVC.js"></script>
    <script src="js/TodoMVC.Todos.js"></script>
    <script src="js/TodoMVC.Layout.js"></script>
    <script src="js/TodoMVC.TodoList.Views.js"></script>
    <script src="js/TodoMVC.TodoList.js"></script>
    <script>
      $(function () {
        // start the TodoMVC app (defined in js/TodoMVC.js)
        TodoMVC.start();
      });
    </script>
  """
}

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: (url, options, fn) ->
      win = @$remoteIframe[0].contentWindow

      ## when the remote iframe's load event fires
      ## callback fn
      @$remoteIframe.one "load", ->
        options.onLoad?(win)
        fn()

      ## if our url is already has a query param
      ## then append our query param to it
      if _.str.include(url, "?")
        url += "&"
      else
        ## else create the query param
        url += "?"

      url += "__initial=true"

      ## any existing global variables will get nuked after it navigates
      # @$remoteIframe[0].contentWindow.location.href = "/__blank/"
      @$remoteIframe.prop "src", "/__remote/#{url}"

      ## poll the window to see if sinon has been executed
      ## if so, call our onBeforeLoad callback
      _.defer =>
        id = setInterval =>
          if win.sinon
            clearInterval(id)
            options.onBeforeLoad?(win)
            win = null
        , 3

      @emit
        method: "visit"
        message: url
        page: @$remoteIframe

  return Visit