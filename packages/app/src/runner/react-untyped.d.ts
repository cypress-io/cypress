// tsconfig.json maps react, react-dom and react-dom/client here so that
// @types/react stays out of this Vue program: its global JSX namespace would
// replace Vue's for every .tsx file. The app only passes these modules through
// to the runner bundle, so it needs no React types.
declare const untyped: unknown

export default untyped
