---
title: Organizations
comments: false
---

Organizations are used to group projects and manage access to those projects.

![Organizations](https://cloud.githubusercontent.com/assets/1271364/22709686/a81ed568-ed48-11e6-8ebd-55c014682815.png)

**With organizations you can:**

- Create projects
- Invite users
- Transfer projects

Once out of beta, organizations will also handle billing.

# Personal Organization

By default, every user of Cypress is given a personal organization - named after you. You cannot delete or edit the name of this default organization.

{% note info  %}
All existing Cypress projects prior to version 0.19.0 were automatically added to your personal organization.
{% endnote %}

# Creating an Organization

You can create an organization from within the [Dashboard](https://on.cypress.io) by going to the *Organizations* tab and clicking *Add Organization*.

![Add Organization dialog](https://cloud.githubusercontent.com/assets/1271364/22709492/f1d3e7e4-ed47-11e6-8f35-64fed633862b.png)

## Inviting Users

You can invite users to Cypress from our {% url 'Dashboard' https://on.cypress.io/dashboard %}. Invited users will see all projects and test runs for the organization.

Even though we are in a **private beta**, any user you invite will automatically be whitelisted to use Cypress. This means you can freely invite your team members without needing to talk to us!

**To invite a user to an organization:**

1. Click the {% fa fa-cog %} beside the Project you want to give the user access to.
2. Click 'Invite User'. *Note: you must have the role of 'owner' or 'admin' to invite users.*
3. Fill in their email and select their role then click 'Invite User' *Note: only 'owner's can give other user's 'owner' access.*
4. The user will receive an invite email with a link to accept the invitation.

![Invite User dialog](https://cloud.githubusercontent.com/assets/1271364/22709421/baf79a54-ed47-11e6-9796-79ba2008d2d2.png)

## User Roles

User's can be assigned roles that affect their access to certain features of the {% url 'Dashboard' https://on.cypress.io/dashboard %}.

- **Member:** Can see the projects, runs, and keys.
- **Admin:** Can also invite, edit and delete users.
- **Owner:** Can also transfer or delete projects. Can delete and edit the organization.

## User Requests

Users can "Request" access to a given organization. If a developer on your team has access to Cypress and your project's source code - they can request to be given access to your Organization. This means instead of you having to invite team members up front, they can simply request access and you can choose to accept or deny them.

![User requesting access](https://cloud.githubusercontent.com/assets/1271364/22709877/61ca46be-ed49-11e6-80cc-d54299634053.png)

## Transferring Projects

You can transfer projects that you own to another organization or another user. You can only transfer projects from our {% url 'Dashboard' https://on.cypress.io/dashboard %}.

![Transfer Project dialog](https://cloud.githubusercontent.com/assets/1271364/22708695/440f4e5c-ed45-11e6-9a98-8f91b67871a3.png)

# Deleting an Organization

You can delete organizations that you own as long as they don't have any projects. You must first transfer ownership of your projects to another organization before you can delete them.

![Delete Organization](https://cloud.githubusercontent.com/assets/1271364/22709764/f9c63e9c-ed48-11e6-885d-ced14d91c3a8.png)
