slug: commands
excerpt: Commands API

Cypress comes with its own API for creating custom commands. In fact, the same public methods *you* have access to are the same ones we use to create all of the built in commands. In other words, there's nothing special or different about ours versus yours. You can customize every aspect of commands, not only their behavior, but also their display in the Command Log.

This allows you to build up specific commands for your application which take their own custom arguments, and perform their own custom behavior.

For example, the first custom command you'll probably create is the canonical `login` command. This typically would navigate the user to your `/login` url, fill out a username / password combination, submit the form, and then assert that the dashboard page comes up (or whatever happens upon successful login).

# [Cypress.addChildCommand()]()

Child commands are always chained off of a **parent** command, or another **child** command.

# [Cypress.addDualCommand]()

While parent commands always start a new chain of commands and child commands require being chained off a parent command, dual commands can behave as parent or child command. That is, they can **start** a new chain, or be chained off of an **existing** chain.

# [Cypress.addParentCommand]()

Parent commands always **begin** a new chain of commands. Even if you've written a previous chain, parent commands will always start a new chain, and ignore previous chains.