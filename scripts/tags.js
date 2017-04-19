'use strict'

hexo.extend.tag.register('note', function(args, content){

  // WHAT IT IS YO
  // [block:callout]
  // {
  //   "type": "info",
  //   "body": "Explore talks, blogs, and podcasts about testing in Cypress.",
  //   "title": "Want to see Cypress in action?"
  // }
  // [/block]

  // {% note info Want to see Cypress in action? %}
  // Explore talks, blogs, and podcasts about testing in Cypress.
  // {% endnote %}
  //
  // <<< Transforms into >>>
  //
  // <blockquote class="note info">
  //   <strong class="note-title">Want to see Cypress in action?</strong>
  //   <p>
  //     Explore talks, blogs, and podcasts about testing in Cypress.
  //   </p>
  // </blockquote>

  var className = args.shift()
  var header = ''
  var result = ''

  if (args.length){
    header += '<strong class="note-title">' + args.join(' ') + '</strong>'
  }

  result += '<blockquote class="note ' + className + '">' + header
  result += hexo.render.renderSync({text: content, engine: 'markdown'})
  result += '</blockquote>'

  return result
}, true)


hexo.extend.tag.register('fa', function(args, content){
  // WHAT IT IS YO
  // :fa-angle-right:

  // {% fa fa-angle-right green fa-fw %}
  //
  // <<< Transforms into >>>
  //
  // <i class="fa fa-angle-right"></i>

  var classNames = args.join(' ')

  return '<i class="fa ' + classNames + '"></i>'
})
