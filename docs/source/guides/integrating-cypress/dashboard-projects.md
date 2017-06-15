---
title: Dashboard&#58; Projects
comments: false
---

A Cypress project represents the directory of files and folders that make up your tests. This is often the same repository as your code, but can also be a subfolder or a separate repository altogether.

# Add a New Project

Projects can *only* be added to Cypress through our Desktop Application.

1. Click {% fa fa-plus %} Add Project.

![Add Project in LeftHand Corner](https://cloud.githubusercontent.com/assets/1271364/22699969/fe44c2e4-ed26-11e6-83d0-9baa0f51b15e.png)

{% note info  %}
Projects added in our Desktop Application are strictly local to your computer. They are not tracked in any way by Cypress servers and do not communicate with us until they are [setup to be recorded](#section-recording-runs).
{% endnote %}

# Set up a Project to Record

During a run we record all failing tests, logs, screenshots, and videos and make these available in our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

**To setup a project to record:**

***1. Click on the "Runs" tab of your project, then click "Setup Project to Record".***

![Setup Project Screen](https://cloud.githubusercontent.com/assets/1271364/22803739/2d66f42a-eee4-11e6-9b84-bd2e73a523d0.png)

***2. Fill in the name of your project (this is only for display purposes and can be changed later).***

![Project Name in Setup Project](https://cloud.githubusercontent.com/assets/1271364/22700406/9b3bc416-ed28-11e6-995b-297350420cce.png)

***3. Choose who owns the project. You can personally own it or select an organization you've created.***

Organizations work just like they do in Github. They enable you to separate your personal and work projects. {% url 'Read more about organizations' dashboard-organizations %}.

![Chosen Organization to Own](https://cloud.githubusercontent.com/assets/1271364/22700579/26353ba6-ed29-11e6-9510-5b7bf4a1cdd2.png)

***4. Choose whether this project is Public or Private.***

- **A public project** can have its recordings and runs seen by *anyone*. Typically these are open source projects.

- **A private project** restricts its access to *only users you invite* to see your Organization or your own projects.

![Privacy of Project](https://cloud.githubusercontent.com/assets/1271364/22803847/95870626-eee4-11e6-9627-7c00e8b77519.png)

***5. Click "Setup Project".***

![Setup Project](https://cloud.githubusercontent.com/assets/1268976/22866093/64a9fb4c-f13e-11e6-9ebe-980ec078ba4e.png)

🎉 Your tests runs are now ready to record! Typically you would record your runs when running in {% url 'Continuous Integration' continuous-integration %} but you can also record your runs from your local computer.

## Record Test Runs

After setting up your project, Cypress inserted a unique [projectId](what-is-a-projectid-) into your `cypress.json`. You'll want to check your `cypress.json` into source control.

In order to record your test runs, you'll also need to provide a [Record Key](what-is-a-record-key-). The record key along with your `projectId` are used by Cypress to uniquely identify your project.

**Provide record key in {% url '`cypress run`' cli-tool#cypress-run %}:**

```shell
cypress run --record --key <record_key>
```

**Or set record key as environment variable**

```shell
export CYPRESS_RECORD_KEY=abc-key-123
```

```shell
cypress run --record
```

Now as soon as tests finish running, you'll see them in the {% url 'Dashboard' https://on.cypress.io/dashboard %} and in the Runs tab of the Desktop Application.

![Runs List](https://cloud.githubusercontent.com/assets/1271364/22800330/ff6c9474-eed6-11e6-9a32-8360d64b1071.png)

![Dashboard Screenshot](https://cloud.githubusercontent.com/assets/1271364/22800284/d4dbe1d8-eed6-11e6-87ce-32474ea1000c.png)

## Project ID

Once you setup your project to record, we generate a unique `projectId` for your project and automatically insert it into your `cypress.json` file.

**The `projectId` is a 6 character string in your `cypress.json`:**

```json
{
  "projectId": "a7bq2k"
}
```

This is helps us uniquely identify your project. If you manually alter this, *Cypress will no longer be able to identify your project or find the recorded builds for it*. We recommend that you check your `cypress.json` including the `projectId` into source control.

## Record Key {% fa fa-key %}

Once you're setup to record test runs, we automatically generate a *Record Key* for the project.

**A record key is a GUID that looks like this:**

```text
f4466038-70c2-4688-9ed9-106bf013cd73
```

You can create multiple Record Keys for a project, or delete existing ones from our {% url 'Dashboard' https://on.cypress.io/dashboard %}. You can also find your Record Key inside of the *Settings* tab on the Desktop App.

![screen shot 2017-02-12 at 4 12 40 pm](https://cloud.githubusercontent.com/assets/1268976/22866094/64aeeb3e-f13e-11e6-93f5-f7420892913f.png)

## Project ID & RecordKey Together

Cypress uses your `projectId` and *Record Key* together to uniquely identify projects.

![ProjectID and Record Keys in Dashboard](https://cloud.githubusercontent.com/assets/1271364/22804089/8498f1a2-eee5-11e6-8598-4e60b4b1fc0b.png)

The record key is used to authenticate that your project is *allowed* to record. As long as your record key stays *private*, nobody will be able to record test runs for your project - even if they have your `projectId`.

If you have a public project you should *still* keep your record key secret. If someone knows both your record key and your `projectId`, they could record test runs for your project - which would mix up all of your results!

Think of your record key as the key that enables you to *write and create* runs. However, it has nothing to do with being able to *read or see* runs once they are recorded.

{% note warning  %}
If your Record Key is accidentally exposed, you should remove it and generate a new one from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.
{% endnote %}

# Public vs Private Projects

- **Public** means that anyone can see the recorded test runs for it. It's similar to how public projects on Github, Travis, or Circle are handled. Anyone who knows your `projectId` will be able to see the recorded runs for public projects.

- **Private** means that only {% url 'users' dashboard-organizations#Inviting-Users %} you explicitly invite to your {% url 'organization' dashboard-organizations %} can see its recorded runs. Even if someone knows your `projectId`, they will not have access to your runs unless you have invited them.

# Transfer Ownership of Project

You can transfer projects that you own to another organization you are a part of or to another user in the organization. Projects can only be transferred from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

![Transfer Project dialog](https://cloud.githubusercontent.com/assets/1271364/22708695/440f4e5c-ed45-11e6-9a98-8f91b67871a3.png)

# Delete a Project

You can delete projects you own. This will also delete all of their recorded runs. Deleting projects can only be done from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

![Delete project dialog](https://cloud.githubusercontent.com/assets/1271364/22708770/89f3080a-ed45-11e6-820e-7a8880fb0c20.png)
