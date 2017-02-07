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

A Cypress project represents the directory of files and folders that make up your tests.

This is often the same repository as your code, but can also be a subfolder or a separate repository altogether.

***

# Adding a new Project

Projects can **only** be added to Cypress through our [Desktop Application](https://on.cypress.io/guides/installing-and-running).

1. Click :fa-plus: Add Project.

![Add Project in LeftHand Corner](https://cloud.githubusercontent.com/assets/1271364/22699969/fe44c2e4-ed26-11e6-83d0-9baa0f51b15e.png)

[block:callout]
{
  "type": "info",
  "body": "Projects added in our Desktop Application are strictly local to your computer. They are not tracked in any way by Cypress servers and do not communicate with us until they are [setup to be recorded](#section-recording-builds)."
}
[/block]

***

# Recording Builds

Integrating your Cypress tests into your build and deployment process is as simple as adding a couple lines to your CI provider's script.

You can also setup your project to have its builds recorded and displayed in both the Desktop Application and the Dashboard.

During a build we record all failing tests, logs, screenshots, and videos.

**To setup a project:**

1. Click on the Builds tab of your project, then click "Setup Project to Record".

![Setup Project Screen](https://cloud.githubusercontent.com/assets/1271364/22700292/2597d81c-ed28-11e6-8cfa-aa3670605418.png)

2. Fill in the name of your project (this is only for display purposes and can be changed later).

![Project Name in Setup Project](https://cloud.githubusercontent.com/assets/1271364/22700406/9b3bc416-ed28-11e6-995b-297350420cce.png)

3. Choose who owns the project. You can personally own it or select an organization you've created. Organizations work just like they do in Github. They enable you seperate your personal and work projects.

[Read more about Organizations.](https://on.cypress.io/guides/organizations)

![Chosen Organization to Own](https://cloud.githubusercontent.com/assets/1271364/22700579/26353ba6-ed29-11e6-9510-5b7bf4a1cdd2.png)

4. Choose whether this project is Public or Private.

**A public project** can have its recordings and builds seen by *anyone*. Typically these are open source projects.

**A private project** restricts its access to *only users you invite* to see your Organization or your own projects.

![Privacy of Project](https://cloud.githubusercontent.com/assets/1271364/22700720/8d539c24-ed29-11e6-97a4-915f008c17db.png)

5. Click "Setup Project".

You are now ready to integrate Cypress into your CI Provider so that builds can be recorded. Integrating Cypress into your CI provider should be pretty straightforward, and we [have a guide](https://on.cypress.io/guides/continuous-integration) describing what you need to do.

[block:callout]
{
  "type": "info",
  "body": "Be sure to check your `cypress.json` into source control."
}
[/block]

Once builds run, you will see them show up in the [Dashboard](https://on.cypress.io/dashboard) and in the Desktop Application.

![Builds List](https://cloud.githubusercontent.com/assets/1271364/22701577/fab631d0-ed2b-11e6-8ee1-f57a89013658.png)

(image of dashboard builds)

***

## What is a projectId?

Once you setup your project to record its builds, we will generate a unique `projectId` for your project, and automatically insert it into your `cypress.json` file.

This is how we uniquely identify your project - a `projectId` is a simple 6 character string.

It will look something like this:

```javascript
// cypress.json
{
  "projectId": "a7bq2k"
}
```

If you manually alter this, **Cypress will no longer be able to identify your project or find the recorded builds for it**.

We recommend that you check your `cypress.json` including the `projectId` into source control.

***

## What is a CI Key?

Once you're setup to record builds, we automatically generate you a CI Key for the project.

(image)

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

Cypress uses your `projectId` and CI Key together to identify projects.

![ProjectID and CI Keys in Dashboard](https://cloud.githubusercontent.com/assets/1271364/22709269/3f6d912c-ed47-11e6-87b1-5792ff322541.png)

The CI Key is used to authenticate that your project is allowed to record. As long as your CI Key stays *private*, nobody will be able to record builds for your project - even if they have your projectId.

If you have a **public project** you should **still** keep your CI Key secret. If someone knows both your CI Key and your `projectId`, they could record builds for your project - which would mix up all the of your results!

Think of your CI Key as the key that enables you to "write and create" builds. However, it has nothing to do with being able to "read or see" builds once they are created.

[block:callout]
{
  "type": "warning",
  "body": "If your CI Key is accidentally exposed, you simply need to remove it and generate a new one from our [Dashboard](https://on.cypress.io/dashboard)."
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

You can transfer projects that you own to another organization you are a part of or to another user in the organization. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

![Transfer Project dialog](https://cloud.githubusercontent.com/assets/1271364/22708695/440f4e5c-ed45-11e6-9a98-8f91b67871a3.png)

***

# Deleting a Project

You can delete projects you own, which will also delete all of their recorded builds. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

![Delete project dialog](https://cloud.githubusercontent.com/assets/1271364/22708770/89f3080a-ed45-11e6-820e-7a8880fb0c20.png)
