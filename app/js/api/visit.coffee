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
      ## when the remote iframe's load event fires
      ## callback fn
      # debugger
      ## navigate the remote iframe to the url

      ## when our iframe navigates to 'about:blank'
      ## this callback will fire
      ## here is where we inject sinon into the window
      # @$remoteIframe.one "load", =>

      #   script = $("<script />", type: "text/javascript")
      #   @$remoteIframe.contents().find("head").append(script)

      #   $.get "/eclectus/js/sinon.js", (resp) =>
      #     script.text(resp)

      #     ## invoke onBeforeLoad if it exists
      #     options.onBeforeLoad?(@$remoteIframe[0].contentWindow)

      #     ## must defer here for some reason... unknown
      #     _.defer =>
      #       ## we setup a new load handler which will fire after we reopen
      #       ## and close our document
      #       ## we pipe in the new ajax'd contents into the document
      #       @$remoteIframe.one "load", =>
      #         debugger
      #         options.onLoad?(@$remoteIframe[0].contentWindow)
      #         fn()

      #       encodedUrl = encodeURIComponent(url)

      #       $.get("/external?url=#{encodedUrl}").done (resp) =>
      #         doc = @$remoteIframe[0].contentWindow.document

      #         head = $.parseHTML(html.head, doc, true)
      #         body = $.parseHTML(html.body, doc, true)

      #         debugger
      #         @$remoteIframe.contents().find("head").append(head)
      #         @$remoteIframe.contents().find("body").append(body)

      #         # $(resp, @$remoteIframe[0].contentWindow.document)

      #         # doc = @$remoteIframe.prop("contentWindow").document.open()

      #         # @$remoteIframe.contents().find("html").html(html)
      #         # win = @$remoteIframe.prop("contentWindow")
      #         # doc = @$remoteIframe.prop("contentWindow").document
      #         # debugger
      #         # doc.open()
      #         # doc.write(resp)
      #         # doc.close()

      @$remoteIframe.one "load", =>
        script = $("<script />", type: "text/javascript")
        @$remoteIframe.contents().find("body").append(script)

        $.get "/eclectus/js/sinon.js", (resp) =>
          script.text(resp)

          fn()

      ## any existing global variables will get nuked after it navigates
      # @$remoteIframe[0].contentWindow.location.href = "/__blank/"
      @$remoteIframe.prop "src", "/__remote/#{url}"

      @emit
        method: "visit"
        message: url
        page: @$remoteIframe

  return Visit