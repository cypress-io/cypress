async function handleComment(github, context) {
    
    // Only continue if the payload was triggered by a comment event and the comment was made by a human user
    if (!context.payload.comment || context.payload.comment.user.type === "Bot") {
      console.log("Payload does not contain a comment event made by a human user.");
      return;
    };
    
    // Get the details of the issue or pull request that triggered the workflow
    const { issue, issue: { pull_request } } = context.payload;
    const issueOrPullRequest = pull_request ? { ...issue, type: "pullRequest" } : { ...issue, type: "issue" };

    const isMemberQuery = `query ($login: String!, $org: String!) {
        user(login: $login) {
          organization(login: $org) {
            viewerIsAMember
          }
        }
      }`;
    const isMemberVariables = {
        login: context.payload.comment.user.login,
        org: context.payload.organization.login
    };
    
    const isMemberResult = await github.graphql(isMemberQuery, isMemberVariables);

    let isCommentFromMember = false;

    if (isMemberResult.user.organization != null) {
        isCommentFromMember = true;
        console.log(`Comment came from a member of the Org.  isCommentFromMember var: ${isCommentFromMember}`);
        
        //Don't do anything if the comment is from a member of the Org
        return
    };
    
    // If comment is from someone outside of the org
    if (!isCommentFromMember) {
        console.log('not from an org member');
        //Get Item Info
        
        const getItemInfoQuery = `query ($org: String!, $repo: String!, $project: Int!, $issue: Int!) {
            organization(login: $org) {
              repository(name: $repo) {
                ${issueOrPullRequest.type}(number: $issue) {
                  closed
                  closedAt
                  id
                  projectItems(first: 10, includeArchived: true) {
                    nodes {
                      id
                      isArchived
                      fieldValueByName(name: "Status") {
                        ... on ProjectV2ItemFieldSingleSelectValue {
                          name
                          field {
                            ... on ProjectV2SingleSelectField {
                              project {
                                ... on ProjectV2 {
                                  id
                                  number
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              projectV2(number: $project) {
                id
                field(name: "Status") {
                  ... on ProjectV2SingleSelectField {
                    id
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }`;
        
        const getItemInfoVars = {
            org: context.payload.organization.login,
            repo: context.payload.repository.name,
            issue: issueOrPullRequest.number,
            project: 9 // Firewatch board: https://github.com/orgs/cypress-io/projects/9
        };

        const getItemInfo = await github.graphql(getItemInfoQuery,getItemInfoVars);

        const issueDataFromGraphQL = getItemInfo.organization.repository[issueOrPullRequest.type];
        const projectID = getItemInfo.organization.projectV2.id;
        //using let because we will need to override this value once we add the item to the project board if it isn't already on it
        let projectItemID = issueDataFromGraphQL.projectItems.nodes.length > 0 ? issueDataFromGraphQL.projectItems.nodes[0].id : null;
        const isItemArchived = issueDataFromGraphQL.projectItems.nodes.length > 0 ? issueDataFromGraphQL.projectItems.nodes[0].isArchived : false;
        const statusFieldID = getItemInfo.organization.projectV2.field.id;
        const status = "New Issue"; // You can hardcode this value, or extract it from the JSON object if needed
        const newStatusColumnID = getItemInfo.organization.projectV2.field.options.find(option => option.name === "New Issue").id;
       
        // If issue is archived on the board, reactivate it
        if(isItemArchived) {
          const unarchiveQuery = `
          mutation ($project_id: ID!, $item_id: ID!) {
            unarchiveProjectV2Item(input: {projectId: $project_id, itemId: $item_id}) {
              clientMutationId
              item {
                id
              }
            }
          }`;

          const unarchiveQueryVars = {
            project_id: projectID,
            item_id: projectItemID,
          };

          const unarchiveItem = await github.graphql(unarchiveQuery,unarchiveQueryVars); 
          
        };

        // If the issue is not on the project board add it to the project board
        if(projectItemID == null) {
          const addToProjectBoardQuery = `
            mutation ($project_id: ID!, $item_id: ID!) {
              addProjectV2ItemById(input: {contentId: $item_id, projectId: $project_id}) {
                clientMutationId
                item {
                  id
                }
              }
            }`;

          const addToProjectBoardQueryVars = {
            project_id: projectID,
            item_id: issueDataFromGraphQL.id,
          };

          const addToProjectBoard = await github.graphql(addToProjectBoardQuery,addToProjectBoardQueryVars);
          projectItemID = addToProjectBoard.addProjectV2ItemById.item.id;

        };
        // If the issue the issue is of status Closed on the project board, move it to the New Issues column
        if(issueDataFromGraphQL.closed) {
          const commentOnClosedItemQuery = `
          mutation (
            $project_id: ID!
            $item_id: ID!
            $status_field_id: ID!
            $status_value_id: String!
          ) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $project_id
              itemId: $item_id
              fieldId: $status_field_id
              value: { 
                singleSelectOptionId: $status_value_id
              }
            }) {
              projectV2Item {
                id
              }
            }
          }`;

          const commentOnClosedItemQueryVars = {
            project_id: projectID,
            item_id: projectItemID,
            status_field_id: statusFieldID,
            status_value_id: newStatusColumnID
          };

          const commentOnClosedItem = await github.graphql(commentOnClosedItemQuery,commentOnClosedItemQueryVars); 
          
        };
    };
};

module.exports = { handleComment };
