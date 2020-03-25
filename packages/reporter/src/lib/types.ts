// These 2 types are defined because TypeScript imports
// the return types of setTimeout and setInterval from NodeJS by default.
// You can solve the problem by adding window in front of
// these functions like window.setTimeout()
// Unfortunately, this makes mocha tests fail.
// That's why these types are created.
export type IntervalID = ReturnType<typeof setInterval>

export type TimeoutID = ReturnType<typeof setTimeout>
