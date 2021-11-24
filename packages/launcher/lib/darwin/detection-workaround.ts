import { detect } from '../detect'

detect(undefined, false).then((browsers) => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(browsers, null, 2))
})
