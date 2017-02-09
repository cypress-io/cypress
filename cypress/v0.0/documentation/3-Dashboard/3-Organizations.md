slug: organizations
excerpt: Manage your Organizations

# Contents

- :fa-angle-right: [What are Organizations?](#section-what-are-organizations-)
  - [Default Organization](#section-default-organization)
- :fa-angle-right: [Managing an Organization](#section-managing-an-organization)
  - [Inviting Users](#section-inviting-users)
  - [User Roles](#section-user-roles)
  - [User Requests](#section-user-requests)
  - [Transferring Projects](#section-transferring-projects)
- :fa-angle-right: [Deleting an Organization](#section-deleting-an-organization)

***

# What are Organizations?

Organizations are used to group projects and to manage permissions for who can access those projects.

![Add Organization dialog](https://cloud.githubusercontent.com/assets/1271364/22709492/f1d3e7e4-ed47-11e6-8f35-64fed633862b.png)

***

## Default Organization

By default, every user of Cypress is given a default organization. This is created in order to ease the process of initially setting up projects to record.

***

# Managing an Organization

![Organizations](https://cloud.githubusercontent.com/assets/1271364/22709686/a81ed568-ed48-11e6-8ebd-55c014682815.png)

***

## Inviting Users

You can invite users to Cypress from our [Dashboard](https://on.cypress.io/dashboard). All invited users will be able to see the projects, runs and keys for the organization's project (even if the project's are private).

Additionally, any users invited will be automatically given access to log in to the Cypress Desktop App and Dashbaord while in Beta.

*To invite a user to an organization:*

1. Click the :fa-cog: beside the Projects you want to give the user access to.
2. Click 'Invite User'. Note: you must have the role of 'owner' or 'admin' to invite users.
3. Fill in the email and select the role for the user and click 'Invite User'
4. The user will recieve an invite email with a link to accept the invitation.

![Invite User dialog](https://cloud.githubusercontent.com/assets/1271364/22709421/baf79a54-ed47-11e6-9796-79ba2008d2d2.png)

***

## User Roles

User's can be assigned roles that affect their access to certain features.

- *Member:* Can see the projects, runs, and keys.
- *Admin:* Can also invite and delete users.
- *Owner:* Can also transfer or delete projects.

***

## User Requests

![User requesting access](https://cloud.githubusercontent.com/assets/1271364/22709877/61ca46be-ed49-11e6-80cc-d54299634053.png)

***

## Transferring Projects

You can transfer projects that you own to another organization you are a part of or to another user in the organization. This functionality only exists in our [Dashboard](https://on.cypress.io/dashboard).

![Transfer Project dialog](https://cloud.githubusercontent.com/assets/1271364/22708695/440f4e5c-ed45-11e6-9a98-8f91b67871a3.png)


***

# Deleting an Organization

Before deleting an organization, ensure that all of the organization's projects are transferred or deleted first. This is to avoid deleting any run data by mistake.

Note: You cannot delete your default organization.

![Delete Organization](https://cloud.githubusercontent.com/assets/1271364/22709764/f9c63e9c-ed48-11e6-885d-ced14d91c3a8.png)
