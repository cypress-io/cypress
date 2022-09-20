# The Cypress App Prioritization and Triage Methodology

At Cypress, we love our open source community. We work every day to grow our partnership with the community through open, honest, and straightforward communication about our processes and plans for the platform. The goal of this document is to provide resources that show our plans for the future and serve as a guide to our processes around handling issues that are raised by the open source community.

## Table of Contents

- [The Cypress App Priorities](#the-cypress-app-priorities)
- [The Cypress App Roadmap](#the-cypress-app-roadmap)
- [The Cypress App Issue Triage](#the-cypress-app-issue-triage)
  - [The Cypress App Triage Process](#the-cypress-app-triage-process)
  - [The Power of a Great Ticket](#the-power-of-a-great-ticket)
- [How We Prioritize Issues](#how-we-prioritize-issues)
  - [Cypress Relative Priority Score](#cypress-relative-priority-score)
  - [Cypress Relative Priority to Effort Score](#cypress-relative-priority-to-effort-score)
- [FAQs](#faqs)
  - [Why Isn't Anyone Working on My Issue?](#why-isnt-anyone-working-on-my-issue)
  - [Why Did You Close My Ticket?](#why-did-you-close-my-ticket)
  - [Backpatching Strategy/Limitations](#backpatching-strategylimitations)
- [How You Can Help](#how-you-can-help)


## The Cypress App Priorities

The Cypress app is constantly looking to improve and grow our testing platform to meet the ever-growing needs of the testing world. Like any software platform, we must balance research, development, and maintenance against real-world resource constraints. We feel that transparency about our future plans will help us grow a stronger relationship with end users who understand that all choices involve trade-offs.

## The Cypress App Roadmap

[The Cypress App Priorities](https://github.com/orgs/cypress-io/projects/13/views/1) board shows the high-level roadmap at Cypress. 

The board flows from left to right as a project moves from the ideation and feasibility phase all the way to General Availability (GA) release. 

Here is a guide to what each column on the board represents:

| Column Name                           | Description            | 
 | :------------------------------------ | :---------------------- | 
 | **Under Consideration**               | These tickets are currently being discussed for future work. We are investigating the complexity of the change, the amount of resources necessary to complete it, and how it aligns with other goals for the platform. It is important to note that **not all** items in this column make their way into our scheduled work. It is possible that, upon investigation, a ticket falls in priority due to other goals or constraints.               | 
| **Planned** |  These are the tickets we are planning to work on, but the work has not yet started. |
| **In Progress** | These tickets are actively being worked on. |
| **Experimental** | If a ticket involves a substantial refactoring of the codebase, is large in scope or is a complex feature, we often release them in a turned-off state. End users can opt in to experiment with these changes via feature flags. Work is still ongoing, but we feel it is important to get this feature in users' hands. Feedback is always welcome, but it is especially helpful during this phase of the development cycle. Not all issues are released under the experimental flag before GA. |
| **Released** | Once an issue has been fully implemented, tested, and bundled into an official release it moves to this column. Features in this column are no longer experimental, feature flags are removed and default behaviors are implemented. |

## The Cypress App Issue Triage

Whenever an issue is created in the [Cypress repo](https://github.com/cypress-io/cypress/) it is added to the [Cypress App Triage Board](https://github.com/orgs/cypress-io/projects/9/views/1). This board represents all issues we are actively working to investigate and reproduce before routing them to the appropriate team for [prioritization](#how-we-prioritize-issues). Prioritization does not necessarily mean that an issue will be worked on - priority scoring simply helps us create a relative ordering of potential work that is ranked according to standards we have defined as most important to Cypress and the community.

### The Cypress App Triage Process

At Cypress, we use two-week sprints. During each sprint, a rotating group of developers is assigned to the triage team. Their responsibilities are only to focus on triaging issues entered into the [Cypress repo](https://github.com/cypress-io/cypress/). Each issue is assigned to a team member for analysis and assessment and follows this general path:  

- **Assessment** - The goal of this step is to do a high-level analysis of the problem. If the issue is clear and the probable impact of the ticket is large in both scope and severity and affecting many users, we will internally escalate the issue and work to get it resolved as quickly as possible. During this phase we will often try and suggest workarounds that may help you get around the issue in the short term while we investigate further.  This may not always be possible, but we will try our best to make sure you are not totally impeded.  

- **Reproduction** - The goal of this phase is to fully understand the issue described in the ticket and, most importantly, replicate the issue. The reason issue replication is so important to us at Cypress is that we believe our teams' development time is best spent on issues we can verify.  In order to know if any solution solves a specific problem, we first need to be able to reliably reproduce it. A vast majority of our time in triage is spent trying to reproduce the issues our users are encountering. With a huge spectrum of users using countless permutations of hardware, operating systems, versions of Cypress, Node.js, CI configurations, unique web applications they are testing, and more, it can be very challenging to narrow down problems into something that is ready for prioritization by a team. This is where our end users can help us the most. The easier it is for us to recreate your issue, the sooner we can route it to our teams for prioritization. The best way to provide a reproducible example of your problem is to fork our [cypress-test-tiny repo](https://github.com/cypress-io/cypress-test-tiny) and replicate the issue there. At a minimum we will need a [short, self contained, correct example](http://sscce.org/) in order to assist in most cases. 

- **Routing** - Once we have clarified any questions we have on a submitted ticket and we are able to replicate the problem internally, the ticket is ready to be routed to the appropriate team at Cypress.

- **Prioritization** - Teams meet regularly to review tickets that have been routed to them via triage. They evaluate each ticket based on a number of criteria outlined in our [prioritization rubric](#prioritization-rubric). Each dimension of our prioritization rubric carries a weight. The following equation is then used to give us a **relative priority**. The relative priority score is then divided by the estimated effort to address the ticket to give us a **priority-to-effort** score which we then use to determine which tickets are the highest priority. 
**Important note - These priorities do not dictate when a team will be able to start work. This simply gives teams the data they need to make informed prioritization choices.**

- **Resolution and Verification** - Once an issue has been picked up for work, it will have the label **Stage: Under Development** attached. Developers will then begin work on the issue. Sometimes the scope of the work will be greater than the ticket submitted, and a parent ticket will be created to encapsulate the entire scope of the work. A link to the original ticket will be created in the new ticket. 

- **Release** - Once work has been finished, the ticket will be scheduled for release. If the changes are non-breaking, we generally aim to include the work in the next minor release every-other Tuesday. If the changes made to address the issue require breaking changes, the issue will be scheduled for our next major release roughly every quarter.

### The Power of a Great Ticket

One of the best ways to help get your ticket validated, replicated, routed and prioritized is to include as much information as possible.  Our issue template will walk you through the most common information that we will need to best troubleshoot the problem.  **Please do not open issues from GitHub discussion comments.**  

Here are some tips for providing a [Short, Self Contained, Correct, Example](http://sscce.org/) and our own [Troubleshooting Cypress](https://on.cypress.io/troubleshooting) guide.  Another great way to assist us in replicating your issue is to fork our [cypress-test-tiny repo](https://github.com/cypress-io/cypress-test-tiny) and recreate the issue there. 

We will always need replication steps, so please include them when submitting an issue. Going back and forth to gather the basic data is all time we could be using to investigate and address the issue, so please be considerate of our developers' time and include the requested details when submitting an issue.

## How We Prioritize Issues

At Cypress, we use the following guidelines to help us standardize the importance of every ticket submitted. Of course there are subjective interpretations for each of these fields, but the goal is that each ticket is considered and examined thoroughly in a standardized way. Once values have been determined for each field, a total priority is calculated. It is important to note that these values are **a guide** to make informed decisions around what issues bring the most value to the community and Cypress as an organization. They are relative and fuzzy and not to be treated as gospel. It is also important to understand that these values may change as future factors and circumstances change.

### Prioritization Rubric

Here are the criteria we use to gauge relative issue priority:

| Criteria | Weight | Description |
|:---------------------|:---------:|:-----------------------------------------------------------------------------------|
| Scope | 0.7 | How many users does this affect? |
| Severity | 1.0 | What does the problem prevent users from doing? Is it an edge case? A primary test flow? A minor annoyance? |
| Visibility | 0.5 | Is this an important issue to our community? Is there a lot of discussion around it? |
| Does Workaround Exist | 0.4 | Does a work around exist that is reasonable? |
| Regression | 0.7 | Did this previously work? How long ago did it last work? Was this a regression within this last (current) major version? |
| Cypress Priority | 0.75 | Does Cypress have a vested interest in resolving this issue? For example, does it ease the support burden for our staff? Is this part of a corporate milestone or objective? |
| Effort | 0.75 | How much effort is needed to resolve the issue? Estimates are for a single developer being assigned to the issue. |

### Cypress Relative Priority Score

The formula for calculating the Cypress Relative Priority Score (CRPS) is the weighted sum of our priority criteria:

$$ \text{Cypress Relative Priority Score} = {{(Scope \times 0.7) + (Severity \times 1.0) + (Visibility \times 0.5) + (WorkAround \times 0.4) + (Regression \times 0.7) + (CypressPriority \times 0.75)}} $$

### Cypress Relative Priority to Effort Score

It is important to remember that just because an issue has a high CRPS, that doesn't mean it is necessarily the best way to allocate limited resources. To determine which gives us the greatest bang for the proverbial buck, we weigh CRPS versus the effort required to address the issue.

$$ \text{Cypress Relative Priority to Effort Score} = {\text{Cypress Relative Priority Score} \over {Effort}} $$

**Cypress Relative Priority to Effort Score** gives us a metric that better represents the effort-to-reward ratio for any proposed work.

## FAQs

### Why isn't anyone working on my issue?!

We understand that it can be frustrating to take time to submit an issue, only to see it sit in the backlog untouched for a long period of time. We truly wish we could take up every single issue that comes in, but given the relatively small size of our internal teams and the large and varied user base of Cypress it just isn't possible to solve every issue. Our prioritization process helps us float the most important issues to the top based on the impact vs effort ratio of any given issue. It is important to remember that, just because an issue is not being actively worked on, does not mean we are ignoring the issue; it means that we have other issues we feel are more impactful to the user base and are prioritizing those issues first.

Even when our internal developers cannot work on your issue, that does not mean all hope is lost!  Being an open source project means you can be part of the solution. We love when our community commits code and want to encourage everyone to feel empowered to contribute and make the product we all love and use even better.  We have guides on [how to contribute](https://github.com/cypress-io/cypress/blob/develop/CONTRIBUTING.md) and a very active [Discord community](https://discord.gg/cypress) which can help if you are interested in opening a PR.  

### Why did you close my ticket?

There are a number of reasons why a ticket may be closed without any change or PR being opened.

- **No Response From Author** -   The most common reason is lack of response from the author. Our issue creation template prompts the user for many details that are vital in debugging and replicating an issue. It is not uncommon for issues to be entered with insufficient information for our teams to properly investigate an issue. We will often reach out for more details, but we do not have the bandwidth to chase down users for information. **If we do not receive a response within 7 days, we will close your ticket.** The best way to help get your issue worked on by a Cypress team member is to provide the information requested and give as much detail as possible (or, even better, a reproducible example in our [cypress-tiny repo](https://github.com/cypress-io/cypress-test-tiny)) in a timely manner.

- **Not a bug or feature request** - Issues entered into the [Cypress repo](https://github.com/cypress-io/cypress) are for bugs and feature requests for the Cypress App only. Updates to [documentation](https://github.com/cypress-io/cypress-documentation), our [example-kitchensink app](https://github.com/cypress-io/cypress-example-kitchensink), or [another repository](https://github.com/cypress-io) should be made in the appropriate repository. 
The best place for asking questions is our [Discord server](https://discord.gg/cypress) which has a very active community of folks with a diverse set of knowledge. Other available channels to explore include [Cypress GitHub discussions](https://github.com/cypress-io/cypress/discussions), [community chat](https://on.cypress.io/chat), and [Stack Overflow](https://stackoverflow.com/questions/tagged/cypress).
We also offer support via email with our [paid plans](https://www.cypress.io/pricing/).

- **Feature request for Cypress Dashboard** - Thank you for your support as a Cypress Dashboard user! These issues are routed to our Cypress Dashboard team's ticketing system. Your customer success representative is available for follow-up and will reach out you directly via email if more information is needed.

- **The fix or feature is not within our vision for Cypress** - There will inevitably be suggestions that will not fit within the scope of Cypress' vision for our product. We will do our best to explain why we will not be addressing this issue.

- **It's a dupe** - The issue you have entered has already been logged by another person. We will link the appropriate ticket and mark the issue as a duplicate.

- **Cannot reproduce ecosystem** - Another common issue that can lead to a ticket being closed is that the setup involved in reproducing the problem is complex and specific to your implementation of Cypress. As any developer can imagine, the variety of ecosystems that run Cypress are as varied as the number of flowers in the world. And not surprisingly, we do not have infrastructure setup to mimic every possible scenario. It is possible, even likely, that we are not set up to investigate your specific use case of Cypress. This does not mean that the issue is not real and that it is not important. It simply means we are not equipped to investigate it any further. We are more than happy to point you in the direction of resources that may help you dive into your problem further on your own but we will not be able to replicate your entire stack internally to properly reproduce your problem. Without a consistent reproduction of the issue, it is highly unlikely an issue will be prioritized by a team for inclusion in their sprint work.  These types of issues are a fantastic opportunity for our community to contribute.  By opening a PR to address an issue you are encountering that is otherwise not being worked on, you are not only helping yourself and your organization but potentially anyone else who may be encountering your issue as well but has not spoken up about it.  Cypress developers are always willing to help clean and prep a PR from the community to help you get it over the line and merged into the code base.  Just open a PR and we will automatically see it on our triage board!  If you have questions along the way, always remember we have a very active and helpful community in [Discord](https://discord.gg/cypress).

- **Stumped, for now** - Sometimes an author provides all the details we could ask for, is very responsive, and uses a straightforward setup - and it still stumps the Cypress devs! The reality is that there are some issues we just can't figure out because of limited resources. We love our large and active community, but in order to support it, sometimes we must move on. We understand this is not something an active issue author wants to hear, but we do not have the resources to put infinite time and energy into every single issue until it is resolved. During the course of our investigation we will attempt to understand the scope of the users being affected by the problem in the issue. If we determine this is an edge case or of low impact to effected users, we will close the issue until such a time that more information comes to light that sheds new insight into the potential root of the problem.  This is another example of a great opportunity for folks in the community to give back and open a PR.  Nothing makes our day better than seeing a PR from the community!  Opening a PR will automatically add that issue to our triage board where a Cypress dev will help you get the PR over the line and merged into the repo for release.  And remember to drop into [Discord](https://discord.gg/cypress) if you have questions or need a helping hand.

### Backpatching Strategy/Limitations

At Cypress, we have a roll-forward approach to support. If you are encountering an issue while using an older version of Cypress, our first step will be to verify the problem is still happening on the latest version of the app. If you are unable to upgrade, we will want to understand what blockers are keeping you from upgrading. We want to understand friction points so that we can build a tool that is easy to stay current on. As such, we will only be backpatching fixes on an ad hoc basis. We will use the [prioritization rubric](#prioritization-rubric) to assess the issue's severity/impact and we will consider the reasons that users may be blocked from upgrading to a newer version of Cypress. 

## How You Can Help

One of the pillars of Cypress' success is our community. Without your input and support we would not be the platform we are today. We wish we had the bandwidth to address every single issue that comes in, but the reality is that there simply isn't enough time in the day for our internal teams to give every single ticket the love and attention it deserves. 

This is where we hope the community can help us. As an open source project, our issue backlogs and source code are all out in the open. Please feel empowered to search those backlogs for issues important to you and add your input. Maybe you can add a reproducible example to a ticket that needs one, or can verify a problem is also happening for you with more detail, or even better - maybe you can [contribute a fix to the repo](https://github.com/cypress-io/cypress/blob/develop/CONTRIBUTING.md)! Your input and engagement is always appreciated.
