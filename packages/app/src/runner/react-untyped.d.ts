// The app imports React through #host/* specifiers, which vite.config.mjs aliases
// to the real packages and tsconfig.json maps here, so that @types/react stays
// out of this Vue program: its global JSX namespace would replace Vue's for every
// .tsx file. The app only passes these modules through to the runner bundle.
// Avoid mapping the bare package names in tsconfig paths: tsx applies them to
// every module a process resolves with packages/app as its working directory.
declare const untyped: unknown

export default untyped
