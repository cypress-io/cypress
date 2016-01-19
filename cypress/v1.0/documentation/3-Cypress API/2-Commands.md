slug: commands
excerpt: Commands API

Cypress comes with its own API for creating custom commands. In fact, the same public methods *you* have access to are the same ones we used to create all of the built in commands. In other words, there's nothing special or different about ours or yours. You can customize every aspect of commands, not only their behavior, but also their display in the Command Log.

This allows you to build up specific commands for your application which take their own custom arguments, and perform their own custom behavior.

For example, the first custom command you'll probably create is the canonical `login` command. This typically would navigate the user to your `/login` url, fill out a username / password combination, submit the form, and then assert that the dashboard page comes up (or whatever happens upon successful login).


## [Cypress.addChildCommand()]()

## [Cypress.addDualCommand]()

## [Cypress.addParentCommand]()