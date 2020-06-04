// allows Typescript to import .coffee files
declare module '*.coffee' {
  const content: any
  export default content
}
