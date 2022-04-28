// This should be the only line in the file when we don't have any local schema
// modifications we're iterating on.
export const LOCAL_TYPES_EXPORT = {}

//-----------------------------------------------------------------------------------------------------
// Provide any local Cloud modifications below, and remove as they are added to the remote schema:
//
// For instance, if we wanted to add a new type called "CloudTestView" that we're planning to add to
// the remote schema, we'd do:
//
// export const CloudTestView = objectType({
//   name: "CloudTestView",
//   description: 'A new type for a view of cloud tests',
//   definition(t) {
//     ...
//   }
// })
//
// And this will now be automatically usable for local definitions, etc.
//-----------------------------------------------------------------------------------------------------
