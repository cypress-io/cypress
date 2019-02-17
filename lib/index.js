// having weak reference to styles prevents garbage collection
// and "losing" styles when the next test starts
export const stylesCache = new Map()

export const setXMLHttpRequest = (w) => {
  // by grabbing the XMLHttpRequest from app's iframe
  // and putting it here - in the test iframe
  // we suddenly get spying and stubbing 😁
  window.XMLHttpRequest = w.XMLHttpRequest
  return w
}

export const setAlert = (w) => {
  window.alert = w.alert
  return w
}
