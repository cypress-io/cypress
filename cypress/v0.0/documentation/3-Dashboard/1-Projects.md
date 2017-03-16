slug: projects
excerpt: Manage your Projects and configure them to record runs

# Contents

- :fa-angle-right: [What Are Projects?](#section-what-are-projects-)
- :fa-angle-right: [Adding a New Project](#section-adding-a-new-project)
- :fa-angle-right: [Setting up a Project to Record](#section-setting-up-a-project-to-record)
  - [How do I record runs?](#section-how-do-i-record-runs-)
  - [What is a projectId?](#section-what-is-a-projectid-)
  - [What is a Record Key?](#section-what-is-a-record-key-)
  - [How do a projectId and Record Key work together?](#how-do-a-projectid-and-record-key-work-together-)
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
  "body": "Projects added in our Desktop Application are strictly local to your computer. They are not tracked in any way by Cypress servers and do not communicate with us until they are [setup to be recorded](#section-recording-runs)."
}
[/block]

***

# Setting up a Project to Record

You can also setup your project to have its test runs recorded and displayed in both the Desktop Application and the Dashboard.

[block:callout]
{
  "type": "info",
  "body": "Not sure what the Dashboard is? [Its our service which displays all of your recorded runs](https://on.cypress.io/guides/dashboard-features)."
}
[/block]

During a run we record all failing tests, logs, screenshots, and videos.

**To setup a project:**

1. Click on the "Runs" tab of your project, then click "Setup Project to Record".

![Setup Project Screen](https://cloud.githubusercontent.com/assets/1271364/22803739/2d66f42a-eee4-11e6-9b84-bd2e73a523d0.png)

2. Fill in the name of your project (this is only for display purposes and can be changed later).

![Project Name in Setup Project](https://cloud.githubusercontent.com/assets/1271364/22700406/9b3bc416-ed28-11e6-995b-297350420cce.png)

3. Choose who owns the project. You can personally own it or select an organization you've created. Organizations work just like they do in Github. They enable you to seperate your personal and work projects. [Read more about Organizations.](https://on.cypress.io/guides/organizations)

![Chosen Organization to Own](https://cloud.githubusercontent.com/assets/1271364/22700579/26353ba6-ed29-11e6-9510-5b7bf4a1cdd2.png)

4. Choose whether this project is Public or Private.

  **A public project** can have its recordings and runs seen by *anyone*. Typically these are open source projects.

  **A private project** restricts its access to *only users you invite* to see your Organization or your own projects.

![Privacy of Project](https://cloud.githubusercontent.com/assets/1271364/22803847/95870626-eee4-11e6-9627-7c00e8b77519.png)

5. Click "Setup Project".

![screen shot 2017-02-12 at 3 46 30 pm](https://cloud.githubusercontent.com/assets/1268976/22866093/64a9fb4c-f13e-11e6-9ebe-980ec078ba4e.png)

You are now ready to record your runs. Typically you would record your runs when running in [Continuous Integration](https://on.cypress.io/guides/continuous-integration) but you can also record your runs from your local computer.

***

## How do I record runs?

Now that your project is setup, Cypress has inserted your unique [projectId](#section-what-is-a-projectid-) into `cypress.json`.

[block:callout]
{
  "type": "info",
  "body": "Be sure to check your `cypress.json` into source control."
}
[/block]

In order to record we also require you provide us your [Record Key](#section-what-is-a-record-key-). The record key along with your projectId uniquely identifies your project.

You can provide the Record Key when running this command:

```shell
cypress run --record --key <record_key>
```

Or you can also set an environment variable and we will automatically look for that.

```shell
## you'd typically set this in your CI provider
export CYPRESS_RECORD_KEY=abc-key-123

## we will automatically search and apply the key
cypress run --record
```

Once tests run, you will see them show up in the [Dashboard](https://on.cypress.io/dashboard) and in the Desktop Application.

![Runs List](https://cloud.githubusercontent.com/assets/1271364/22800330/ff6c9474-eed6-11e6-9a32-8360d64b1071.png)

![Dashboard Screenshot](https://cloud.githubusercontent.com/assets/1271364/22800284/d4dbe1d8-eed6-11e6-87ce-32474ea1000c.png)

***

## What is a projectId?

Once you setup your project to record, we generate a unique `projectId` for your project, and automatically insert it into your `cypress.json` file.

**The `projectId` is a 6 character string in your cypress.json:**

```javascript
// cypress.json
{
  "projectId": "a7bq2k"
}
```

This is how we uniquely identify your project. If you manually alter this, **Cypress will no longer be able to identify your project or find the recorded builds for it**. We recommend that you check your `cypress.json` including the `projectId` into source control.

***

## What is a Record Key?

Once you're setup to record test runs, we automatically generate a **Record Key** for the project.

**A record key is a GUID that looks like this:**

```shell
f4466038-70c2-4688-9ed9-106bf013cd73
```

[block:callout]
{
  "type": "info",
  "body": "You can create multiple Record Keys for a project, or delete existing ones from our [Dashboard](https://on.cypress.io/dashboard)."
}
[/block]

You can also find your Record Key inside of the **Settings** tab.


![screen shot 2017-02-12 at 4 12 40 pm](https://cloud.githubusercontent.com/assets/1268976/22866094/64aeeb3e-f13e-11e6-93f5-f7420892913f.png)

***

## How do a projectId and Record Key work together?

Cypress uses your `projectId` and **Record Key** together to uniquely identify projects.

![ProjectID and Record Keys in Dashboard](https://cloud.githubusercontent.com/assets/1271364/22804089/8498f1a2-eee5-11e6-8598-4e60b4b1fc0b.png)

The record key is used to authenticate that your project is *allowed* to record. As long as your record key stays *private*, nobody will be able to record test runs for your project - even if they have your `projectId`.

If you have a public project you should *still* keep your record key secret. If someone knows both your record key and your `projectId`, they could record test runs for your project - which would mix up all of your results!

Think of your record key as the key that enables you to **write and create** builds. However, it has nothing to do with being able to **read or see** builds once they are created.

[block:callout]
{
  "type": "warning",
  "body": "If your Record Key is accidentally exposed, you simply need to remove it and generate a new one from our [Dashboard](https://on.cypress.io/dashboard)."
}
[/block]

***

## What is the difference between public and private projects?

**A public project** means that anyone can see the recorded runs for it. It's similar to how public projects on Github, Travis, or Circle are handled. Anyone who knows your `projectId` will be able to see the recorded runs for public projects.

**A private project** means that only [users](https://on.cypress.io/guides/organizations#section-inviting-users) you explicitly invite to your [organization](https://on.cypress.io/guides/organizations) can see its recorded runs. Even if someone knows your `projectId`, they will not have access to your runs unless you have invited them.

A Record Key has nothing to do with **viewing** build data - it's a "write only" key. Even if it is accidentally leaked, it will not affect who can "see" your builds.

***

# Transferring Ownership of a Project

You can transfer projects that you own to another organization you are a part of or to another user in the organization. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

![Transfer Project dialog](https://cloud.githubusercontent.com/assets/1271364/22708695/440f4e5c-ed45-11e6-9a98-8f91b67871a3.png)

***

# Deleting a Project

You can delete projects you own. This will also delete all of their recorded runs. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

![Delete project dialog](https://cloud.githubusercontent.com/assets/1271364/22708770/89f3080a-ed45-11e6-820e-7a8880fb0c20.png)
