slug: projects
excerpt: Manage your Projects and configure them to record builds

# Contents

- :fa-angle-right: [What Are Projects?](#section-what-are-projects-)
- :fa-angle-right: [Adding a New Project](#section-adding-a-new-project)
- :fa-angle-right: [Recording Builds](#section-recording-builds)
  - [What is a projectId?](#section-what-is-a-projectid-)
  - [What is a CI Key?](#section-what-is-a-ci-key-)
  - [What is the difference between public and private projects?](#section-what-is-the-difference-between-public-and-private-projects-)
- :fa-angle-right: [Transferring Ownership of a Project](#section-transferring-ownership-of-a-project)
- :fa-angle-right: [Deleting a Project](#section-deleting-a-project)

***

# What are Projects?

A Cypress project represents the directory of files and folders which make up your tests.

This is often the same repository as your code, but can also be a subfolder or a separate repository altogether.

***

# Adding a new Project

Projects can **only** be added to Cypress through our Desktop Application.

1. Click to add a new project.

(image)

2. You will now see it alongside any other projects you've added.

(image)

[block:callout]
{
  "type": "info",
  "body": "By default Projects are stricly local to your computer. They are not tracked in any way by our servers and do not communicate with us until they are setup to be recorded."
}
[/block]

***

# Recording Builds

After you and your team has adopted Cypress, you're likely ready to integrate Cypress into your build and deployment processes. This usually is as simple as adding a couple lines to your CI provider's script.

You can also setup your project to have its builds recorded and displayed in both the Desktop Application and the Dashboard.

During a build we will record all failing tests, logs, screenshots, and videos.

**To setup a project:**

1. Click on the Builds tab for your project

(image)

2. Click "Setup Project to Record"

(image)

3. Fill in the name of your project. This is purely for display purposes and can be changed later.

(image)

4. Choose who owns this project. You can add it to yourself, or select an organization you've created. Organizations work just like they do on Github. They enable you organize your projects between personal and work.

You can [read more](https://on.cypress.io/guides/organizations) about Organizations here.

(image)

5. Choose whether this project is public or private.

**A public project** can have its recordings and builds seen by anyone. Typically these are open source projects.

**A private project** restricts its access to **only users you invite** into your Organization.

(image)

6. Click setup.

You are now ready to integrate Cypress into your CI Provider and then builds will be recorded.

Once builds run, you will see them show up in the Dashboard and in the Desktop Application.

(image)

Integrating Cypress into your CI provider should be pretty straightforward, and we [have a guide](https://on.cypress.io/guides/continuous-integration) describing what you need to do.

[block:callout]
{
  "type": "info",
  "body": "Be sure to check your `cypress.json` into source control."
}
[/block]

***

## What is a projectId?

Once you setup your project to record its builds, we will generate a unique projectId for your project, and automatically insert it into your `cypress.json` file.

This is how we uniquely identify your project - a projectId is a simple 6 character string.

It will look something like this:

```javascript
// cypress.json
{
  "projectId": "a7bq2k"
}
```

If you manually alter this, Cypress will no longer be able to identify your project or find the recorded builds for it.

You should check the projectId into source control.

***

## What is a CI Key?

Once you're setup, we will automatically generate you a CI Key for this project.

A CI Key is a GUID that looks like this:

```shell
f4466038-70c2-4688-9ed9-106bf013cd73
```

[block:callout]
{
  "type": "info",
  "body": "You can create multiple CI Keys for a project, or delete existing ones from our [Dashboard](https://on.cypress.io/dashboard)."
}
[/block]

Cypress uses your projectId and CI Key together to identify your project.

Your CI Key is how we authenticate that your project is allowed to record.

As long as your CI Key stays private, nobody will be able to record builds for your project - even if they have your projectId.

If you have a **public project** you will **still** need to keep your CI Key secret. If someone knows both your CI Key and your projectId, they could record builds for your project - which would mix up all the results!

Think of your CI Key as the key that enables you to "write and create" builds. However, it has nothing to do with being able to "read or see" builds once they are created. Read on to understand our security model.


[block:callout]
{
  "type": "warning",
  "body": "If you accidentally leak your CI Key, you simply need to remove it and generate a new one from our [Dashboard](https://on.cypress.io/dashboard)."
}
[/block]

***

## What is the difference between public and private projects?

Public vs Private projects have different security authorization mechanisms.

**A public project** means that anyone can see the builds for it. It's the same as public projects on Github, Travis, or Circle.

Anyone who knows your **projectId** will be able to see the recorded builds.

**A private project** means that only users you explicitly invite to your organization can see its builds.

Even if someone knows your projectId, they will not have access to your builds unless you have invited them.

A CI Key has nothing to do with **viewing** build data - it's a "write only" key. Even if it is accidentally leaked, it will not affect who can "see" your builds.

***

# Transferring Ownership of a Project

You can transfer projects between organizations you are a part of. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

(image)

***

# Deleting a Project

You can delete projects you own, which will also delete all of their recorded builds. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

(image)
