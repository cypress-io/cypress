const generate = (proxyPort, bypassPort) => {
  return `
    function FindProxyForURL (url, host) {
      var bypassPort = ${bypassPort};

      if (bypassPort && url.indexOf(':' + ${bypassPort}) > -1) {
        return 'DIRECT';
      }

      return 'PROXY http://127.0.0.1:${proxyPort}';
    }
  `
}

module.exports = {
  generate,
}
