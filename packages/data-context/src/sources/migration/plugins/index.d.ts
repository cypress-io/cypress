import type { OldCypressConfig } from ".."

export declare const initOldPlugins: (config:OldCypressConfig, 
  options: {
    projectRoot:string,
    configFile:string,
    testingType:'e2e'|'component',
    onError: (err:Error)=>void,
    onWarning: (err:Error)=>void,
  }) => Promise<OldCypressConfig>