# Mocking network

- [1-users-spec.js](1-users-spec.js) tests [1-users.jsx](1-users.jsx) that uses Axios to GET a list of users. Axios uses XMLHttpRequest to receive the data
- [2-users-fetch-spec.js](2-users-fetch-spec.js) tests [2-users-fetch.jsx](2-users-fetch.jsx) that uses `fetch` directly, assuming `"experimentalFetchPolyfill": true` in `cypress.json`, read [Experimental Fetch Polyfill](https://www.cypress.io/blog/2020/06/29/experimental-fetch-polyfill/)
