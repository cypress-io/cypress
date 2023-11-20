const qwikDep = {
  type: 'qwik',
  name: 'Qwik',
  package: '@builder.io/qwik',
  installer: '@builder.io/qwik',
  description:
    'An Open-Source sub-framework designed with a focus on server-side-rendering, lazy-loading, and styling/animation.',
  minVersion: '^0.17.5',
}

module.exports = {
  type: 'cypress-ct-qwik',

  category: 'library',

  name: 'Qwik',

  supportedBundlers: ['vite'],

  detectors: [qwikDep],

  // Cypress will include the bundler dependency here, if they selected one.
  dependencies: () => {
    return [qwikDep]
  },

  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 274"><defs><linearGradient id="logosQwik0" x1="22.347%" x2="77.517%" y1="49.545%" y2="50.388%"><stop offset="0%" stop-color="#4340C4"/><stop offset="12%" stop-color="#4642C8"/><stop offset="100%" stop-color="#594EE4"/></linearGradient><linearGradient id="logosQwik1" x1="38.874%" x2="60.879%" y1="49.845%" y2="50.385%"><stop offset="0%" stop-color="#4340C4"/><stop offset="74%" stop-color="#534ADB"/><stop offset="100%" stop-color="#594EE4"/></linearGradient><linearGradient id="logosQwik2" x1="-.004%" x2="100.123%" y1="49.529%" y2="50.223%"><stop offset="0%" stop-color="#4340C4"/><stop offset="23%" stop-color="#4340C4"/><stop offset="60%" stop-color="#4F48D5"/><stop offset="100%" stop-color="#594EE4"/></linearGradient><linearGradient id="logosQwik3" x1="35.4%" x2="64.895%" y1="49.459%" y2="50.085%"><stop offset="0%" stop-color="#0080FF"/><stop offset="100%" stop-color="#00B9FF"/></linearGradient><linearGradient id="logosQwik4" x1="-.243%" x2="100.411%" y1="49.366%" y2="50.467%"><stop offset="0%" stop-color="#0080FF"/><stop offset="17%" stop-color="#008BFF"/><stop offset="47%" stop-color="#00A7FF"/><stop offset="63%" stop-color="#00B9FF"/><stop offset="100%" stop-color="#00B9FF"/></linearGradient><linearGradient id="logosQwik5" x1="-.125%" x2="100.225%" y1="49.627%" y2="50.101%"><stop offset="0%" stop-color="#00B9FF"/><stop offset="30%" stop-color="#0080FF"/><stop offset="60%" stop-color="#2D67F1"/><stop offset="86%" stop-color="#4D55E8"/><stop offset="100%" stop-color="#594EE4"/></linearGradient><linearGradient id="logosQwik6" x1="4.557%" x2="99.354%" y1="50.184%" y2="51.298%"><stop offset="0%" stop-color="#4340C4"/><stop offset="12%" stop-color="#4642C8"/><stop offset="100%" stop-color="#594EE4"/></linearGradient></defs><path fill="url(#logosQwik0)" d="m175.051 236.859l25.162-15.071l49.298-86.929l-76.287 89.097z"/><path fill="url(#logosQwik1)" d="m242.337 80.408l-4.926-9.4l-1.932-3.663l-.2.196l-25.818-47.015C202.984 8.65 190.631 1.231 177.01 1.074l-25.074.206L188.15 114.8l-23.958 23.331l8.924 86.245l73.769-84.021c10.005-11.587 11.97-28.09 4.92-41.646l-9.466-18.302h-.002Z"/><path fill="url(#logosQwik2)" d="m201.113 72.256l-43.18-70.907L83.41.003C70.165-.15 57.83 6.573 50.88 17.87L7.01 101.747l34.443-33.334L84.701 8.356l97.894 112.153l18.3-18.626c8.397-8.142 5.54-19.558.22-29.625l-.002-.002Z"/><path fill="url(#logosQwik3)" d="M97.784 95.26L84.522 8.796l-73.148 88.03c-12.328 11.935-14.897 30.662-6.419 45.49l42.98 74.727c6.553 11.464 18.755 18.577 32.024 18.729l42.945.49L71.46 119.607L97.784 95.26Z"/><path fill="url(#logosQwik4)" d="M173.227 223.9L71.38 119.022l-13.196 12.59c-10.812 10.248-11.106 27.332-.728 37.921l43.99 66.384l70.65.907l1.127-12.926h.003Z"/><path fill="url(#logosQwik5)" d="m101.584 235.903l72.292-11.599l47.704 49.464z"/><path fill="url(#logosQwik6)" d="m173.111 224.483l27.168-3.457l24.096 49.915c1.06 2.06-1.719 3.977-3.373 2.302l-47.89-48.76Z"/><path fill="#FFF" d="M182.708 120.058L84.681 8.601l12.502 85.958L71.16 118.78l101.772 105.372l-7.595-85.905l17.371-18.192z"/></svg>',
}
