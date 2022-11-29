interface ReactComponentDescriptor {
  description: string
  displayName: string
}

declare module 'react-docgen' {
  const resolver = {
    findAllExportedComponentDefinitions: any,
  }

  function parse(src: string, resolver: any): ReactComponentDescriptor[]
}
