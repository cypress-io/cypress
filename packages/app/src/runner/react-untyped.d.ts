// The app imports React through #host/* specifiers, which vite.config.mjs aliases
// to the real packages and tsconfig.json maps here, typing them as unknown. The
// app only passes these modules through to the runner bundle, so it doesn't need
// their types.
// Avoid mapping the bare package names in tsconfig paths: tsx applies them to
// every module a process resolves with packages/app as its working directory.
declare const untyped: unknown

export default untyped
