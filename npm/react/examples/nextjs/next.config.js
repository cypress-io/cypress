const withMDX = require('@next/mdx')()
const withSass = require('@zeit/next-sass')

module.exports = withSass(withMDX())
