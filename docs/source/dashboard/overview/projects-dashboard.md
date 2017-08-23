---
title: Projects
comments: false
---

A Cypress project represents the directory of files and folders that make up your tests. This is often the same repository as your code, but can also be a subfolder or a separate repository altogether.

# Add a New Project

Projects can *only* be added to Cypress through our Desktop Application.

1. Drag your project into the Desktop App or click 'select manually'.

{% img no-border /img/guides/add-your-first-project-in-guid.png "Adding an empty folder to Cypress Desktop" %}

{% note info  %}
Projects added in our Desktop Application are strictly local to your computer. They are not tracked in any way by Cypress servers and do not communicate with us until they are {% urlHash "setup to be recorded" Set-up-a-Project-to-Record %}.
{% endnote %}

# Set up a Project to Record

During a run we record all failing tests, logs, screenshots, and videos and make these available in our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

***To setup a project to record:***

**1. Click on the "Runs" tab of your project, then click "Setup Project to Record".**

![Setup Project Screen](/img/dashboard/setup-project-to-record-in-desktop-gui.png)

**2. Fill in the name of your project (this is only for display purposes and can be changed later).**

![Project Name in Setup Project](/img/dashboard/fill-in-project-name-to-setup-project-to-record.png)

**3. Choose who owns the project. You can personally own it or select an organization you've created.**

Organizations work just like they do in Github. They enable you to separate your personal and work projects. {% url 'Read more about organizations' organizations-dashboard %}.

![Chosen Organization to Own](/img/dashboard/select-organization-who-should-own-project.png)

**4. Choose whether this project is Public or Private.**

- **A public project** can have its recordings and runs seen by *anyone*. Typically these are open source projects.

- **A private project** restricts its access to *only users you invite* to see your Organization or your own projects.

![Privacy of Project](/img/dashboard/choose-privacy-of-recorded-project.png)

**5. Click "Setup Project".**

![Setup Project](/img/dashboard/after-setting-up-project-to-record-screen.png)

🎉 Your tests runs are now ready to record! Typically you would record your runs when running in {% url 'Continuous Integration' continuous-integration %} but you can also record your runs from your local computer.

## Record Test Runs

After setting up your project, Cypress inserted a unique {% urlHash "projectId" Project-ID %} into your `cypress.json`. You'll want to check your `cypress.json` into source control.

In order to record your test runs, you'll also need to provide a {% urlHash "Record Key" Record-Key %}. The record key along with your `projectId` are used by Cypress to uniquely identify your project.

***Provide record key in {% url '`cypress run`' command-line#cypress-run %}:***

```shell
cypress run --record --key <record_key>
```

***Or set record key as environment variable***

```shell
export CYPRESS_RECORD_KEY=abc-key-123
```

```shell
cypress run --record
```

Now as soon as tests finish running, you'll see them in the {% url 'Dashboard' https://on.cypress.io/dashboard %} and in the Runs tab of the Desktop Application.

![Runs List](/img/dashboard/runs-list-in-desktop-gui.png)

![Dashboard Screenshot](/img/dashboard/dashboard-runs-list.png)

## Project ID

Once you setup your project to record, we generate a unique `projectId` for your project and automatically insert it into your `cypress.json` file.

***The `projectId` is a 6 character string in your `cypress.json`:***

```json
{
  "projectId": "a7bq2k"
}
```

This is helps us uniquely identify your project. If you manually alter this, **Cypress will no longer be able to identify your project or find the recorded builds for it**. We recommend that you check your `cypress.json` including the `projectId` into source control.

## Record Key {% fa fa-key %}

Once you're setup to record test runs, we automatically generate a *Record Key* for the project.

***A record key is a GUID that looks like this:***

```text
f4466038-70c2-4688-9ed9-106bf013cd73
```

You can create multiple Record Keys for a project, or delete existing ones from our {% url 'Dashboard' https://on.cypress.io/dashboard %}. You can also find your Record Key inside of the *Settings* tab on the Desktop App.

![Record Key in Configuration Tab](/img/dashboard/record-key-shown-in-desktop-gui-configuration.png)

## Authentication

Cypress uses your `projectId` and *Record Key* together to uniquely identify projects.

![ProjectID and Record Keys in Dashboard](/img/dashboard/project-id-and-record-key-shown-in-dashboard.png)

The record key is used to authenticate that your project is *allowed* to record. As long as your record key stays *private*, nobody will be able to record test runs for your project - even if they have your `projectId`.

If you have a public project you should *still* keep your record key secret. If someone knows both your record key and your `projectId`, they could record test runs for your project - which would mix up all of your results!

Think of your record key as the key that enables you to *write and create* runs. However, it has nothing to do with being able to *read or see* runs once they are recorded.

{% note warning  %}
If your Record Key is accidentally exposed, you should remove it and generate a new one from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.
{% endnote %}

# Public vs Private Projects

- **Public** means that anyone can see the recorded test runs for it. It's similar to how public projects on Github, Travis, or Circle are handled. Anyone who knows your `projectId` will be able to see the recorded runs for public projects.

- **Private** means that only {% url 'users' organizations-dashboard#Inviting-Users %} you explicitly invite to your {% url 'organization' organizations-dashboard %} can see its recorded runs. Even if someone knows your `projectId`, they will not have access to your runs unless you have invited them.

# Transfer Ownership of Project

You can transfer projects that you own to another organization you are a part of or to another user in the organization. Projects can only be transferred from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

![Transfer Project dialog](/img/dashboard/transfer-ownership-of-project-dialog.png)

# Delete a Project

You can delete projects you own. This will also delete all of their recorded runs. Deleting projects can only be done from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

![Delete project dialog](/img/dashboard/remove-project-dialog.png)
