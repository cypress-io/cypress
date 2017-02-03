slug: managing-projects
excerpt: Add, Edit, and Transfer Projects

# Contents

- :fa-angle-right: [What Are Projects?](#section-what-are-projects)
- :fa-angle-right: [Adding a New Project](#section-adding-a-new-project)
- :fa-angle-right: [Setting Up a Project to Record Builds](#section-adding-a-new-project)
  - [What is the projectId used for?](#section-adding-a-new-project)
  - [What's the difference between a public and private project?](#section-adding-a-new-project)
  - [Giving Users Access to a Private Project](#section-adding-a-new-project)
- :fa-angle-right: [Transferring Ownership of a Project](#section-adding-a-new-project)
- :fa-angle-right: [Deleting a Project](#section-adding-a-new-project)

***

# What are Projects?

Projects in Cypress represent the directory of files and folders that represent the project of work you want to test. This can be thought of as the same as the repository you check into source control.

***

# Adding a New Project

Projects can be added to Cypress through our Desktop Application.

- Add the parent directory of your project to Cypress by clicking :fa-folder-o: Add Project in the top-left corner.

After adding a new project, Cypress automatically scaffolds out a suggested folder structure into your directory. By default it will create:

```text
/cypress
/cypress/fixtures
/cypress/integration
/cypress/support
```

Cypress also adds placeholder files to help get you started with examples in each folder.

**Example JSON fixture**
```text
/cypress/fixtures/example.json
```

**Example Integration Test**
```text
/cypress/integration/example_spec.js
```

**Example JavaScript Support Files**
```text
/cypress/support/commands.js
/cypress/support/defaults.js
/cypress/support/index.js
```

While Cypress allows for configuration of where your tests, fixtures, and support files can be located, if you're starting your first project, we recommend you use the above structure.

[block:callout]
{
  "type": "info",
  "body": "You can modify the folder configuration in your `cypress.json`. See [configuration](https://on.cypress.io/guides/configuration) for more detail.",
  "title": "Configure Folder Structure"
}
[/block]

***

# Setting Up a Project to Record Builds

After getting some intial tests written and running in Cypress, the next step is to have your tests run continously in Continous Integration.

Cypress requires that only a few steps be done in order to record your test results, screenshots, and videos for display in our Cypress Dashboard.

- Click on the Builds tab in the Desktop Application.
- Click "Setup Project to Record"
- Fill in the name of your project (this is initially set to the directories name)
- Choose who owns the project. Ownership will help decide who has access to your builds and recordings.
- Choose the access of the project. If public, anyone can see the builds and recordings of your project's tests. If private, you choose who is invited to see the builds.

***

## What is the projectId used for?

Your `projectId` is set inside your `cypress.json`. This is how Cypress identifies your project. It is recommended that your `cypress.json` with the `projectID` be checked into source control and shared with everyone on your team.

If the projectId is changed, Cypress will no longer be able to identify the project and find the builds for it.

***

## What's the difference between a public and private project?

***

## Giving Users Access to a Private Project

A private project is only accessible to user's who are members of the project's organization.

***

# Transferring Ownership of a Project

You can transfer ownership of a project after creating one.

***

# Deleting a Project

Deleting a project will also delete ALL builds ever recorded for the project.

***

# Related

- [Continuous Integration](https://on.cypress.io/guides/continuous-integration)
