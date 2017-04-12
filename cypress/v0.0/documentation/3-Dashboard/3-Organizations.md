slug: organizations
excerpt: Manage your Organizations

# Contents

- :fa-angle-right: [What are Organizations?](#what-are-organizations-)
  - [Personal Organization](#personal-organization)
- :fa-angle-right: [Creating an Organization](#creating-an-organization)
  - [Inviting Users](#inviting-users)
  - [User Roles](#user-roles)
  - [User Requests](#user-requests)
  - [Transferring Projects](#transferring-projects)
- :fa-angle-right: [Deleting an Organization](#deleting-an-organization)

***

# What are Organizations?

Organizations are used to group projects and to manage permissions for who can access those projects.

![Organizations](https://cloud.githubusercontent.com/assets/1271364/22709686/a81ed568-ed48-11e6-8ebd-55c014682815.png)

With organizations you can:

- Create projects
- Invite users

Once out of beta, organizations will also handle billing.

[block:callout]
{
  "type": "info",
  "body": "Cypress Organizations are meant to work similar to GitHub Organizations."
}
[/block]

***

## Personal Organization

By default, every user of Cypress is given a personal organization - named after you.

You cannot delete or edit the name of this organization.

[block:callout]
{
  "type": "info",
  "body": "All existing Cypress projects prior to version 0.19.0 were automatically added to your personal organization."
}
[/block]

***

# Creating an Organization

![Add Organization dialog](https://cloud.githubusercontent.com/assets/1271364/22709492/f1d3e7e4-ed47-11e6-8f35-64fed633862b.png)

***

## Inviting Users

You can invite users to Cypress from our [Dashboard](https://on.cypress.io/dashboard). Invited users will see the projects and runs for your organization.

Even though we are in a **private beta**, any user you invite will automatically be whitelisted to use Cypress. This means you can freely invite your team members without needing to talk to us!

*To invite a user to an organization:*

1. Click the :fa-cog: beside the Projects you want to give the user access to.
2. Click 'Invite User'. Note: you must have the role of 'owner' or 'admin' to invite users.
3. Fill in the email and select the role for the user and click 'Invite User' Note: only 'owner's can give other user's 'owner' access.
4. The user will recieve an invite email with a link to accept the invitation.

![Invite User dialog](https://cloud.githubusercontent.com/assets/1271364/22709421/baf79a54-ed47-11e6-9796-79ba2008d2d2.png)

***

## User Roles

User's can be assigned roles that affect their access to certain features.

- **Member:** Can see the projects, runs, and keys.
- **Admin:** Can also invite, edit and delete users.
- **Owner:** Can also transfer or delete projects. Can delete and edit the organization.

***

## User Requests

We have also built Cypress with the ability for users to "Request" access to a given organization. This makes for a very natural flow.

If a developer on your team has access to Cypress and your project's source code - they can request to be given access to your Organization.

This means instead of you having to invite team members up front, they can simply request access and you can choose to accept or deny them.

![User requesting access](https://cloud.githubusercontent.com/assets/1271364/22709877/61ca46be-ed49-11e6-80cc-d54299634053.png)

***

## Transferring Projects

You can transfer projects that you own to another organization or another user.

This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

![Transfer Project dialog](https://cloud.githubusercontent.com/assets/1271364/22708695/440f4e5c-ed45-11e6-9a98-8f91b67871a3.png)


***

# Deleting an Organization

You can delete organizations that you own as long as they don't have any projects. You must first transfer ownership of your projects to another organization before you can delete them.

![Delete Organization](https://cloud.githubusercontent.com/assets/1271364/22709764/f9c63e9c-ed48-11e6-885d-ced14d91c3a8.png)
