const el = document.getElementById('extension')

if (el) {
  el.textContent = 'inserted from extension!'
}

// get the active tab
// chrome.tabs.query({ active: true }, (tabs) => {
//   if (tabs && tabs.length) {
//     const tab = tabs[0]
//
//     // example how to get all frames by their id (useful)
//     chrome.webNavigation.getAllFrames({ tabId: tab.id }, (frames) => {
//       debugger
//     })
//
//     //
//     chrome.tabs.executeScript(
//       tab.id,
//       {
//         code: 'document.body.textContent' },
//         frameId: frames[2].id,
//       },
//       (result) => {
//         debugger
//       }
//     )
//   }
// })
