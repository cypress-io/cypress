declare module '@cypress/get-windows-proxy' {
  type ProxyConfig = {
    httpProxy: string
    noProxy: string
  }
  function getWindowsProxy(): Optional<ProxyConfig>
  export = getWindowsProxy
}
