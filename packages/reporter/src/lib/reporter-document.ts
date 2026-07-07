// The reporter can be rendered into a same-origin iframe so its layout lives in
// a separate document from the AUT iframe's parent document. Reporter code that
// binds document-level listeners or portals DOM nodes must target the document
// the reporter is actually rendered into, not the top document its JS runs in.
let reporterDocument: Document = document

export const setReporterDocument = (doc: Document) => {
  reporterDocument = doc
}

export const getReporterDocument = () => reporterDocument

export const getReporterBody = () => reporterDocument.body
