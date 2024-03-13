/* global hljs, $ */

// initialize highlight.js for JavaScript code highlighting
hljs.initHighlightingOnLoad()

$(() => {
  // initialize Bootstrap popovers
  $('[data-toggle="popover"]').popover()

  // begin: draw dots on canvas on mouse click ---
  let canvas = document.getElementById('action-canvas')

  let context

  context = typeof canvas !== 'undefined' && canvas !== null ? canvas.getContext('2d') : 0

  $('#action-canvas').on('click', (e) => {
    draw(e)
  })

  function draw (e) {
    let pos = getMousePos(canvas, e)
    let posx = pos.x
    let posy = pos.y

    context.fillStyle = 'red'
    context.beginPath()
    context.arc(posx, posy, 5, 0, 2 * Math.PI)
    context.fill()
  }

  function getMousePos (canvas, evt) {
    let rect = canvas.getBoundingClientRect()

    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    }
  }
  // end -----------------------------------------

  // listen to dblclick to demonstrate logic on double click command
  $('.action-div').on('dblclick', (e) => {
    $('.action-input-hidden').removeClass('hidden').focus()
    $(e.currentTarget).addClass('hidden')
  })

  // listen to contextmenu to demonstrate logic on right click command
  $('.rightclick-action-div').on('contextmenu', (e) => {
    $('.rightclick-action-input-hidden').removeClass('hidden').focus()
    $(e.currentTarget).addClass('hidden')
  })

  // listen to focus to demonstrate logic on focus command
  $('.action-focus').on('focus', (e) => {
    $(e.currentTarget).addClass('focus')
    $(e.currentTarget).prev().css('color', 'orange')
  })

  // listen to blur to demonstrate logic on blur command
  $('.action-blur').on('blur', (e) => {
    $(e.currentTarget).addClass('error')
    $(e.currentTarget).prev().css('color', 'red')
  })

  // listen to submit to demonstrate logic on submit command
  $('.action-form').on('submit', (e) => {
    e.preventDefault()

    $('<p>Your form has been submitted!</p>')
    .insertAfter(e.currentTarget)
    .css('color', '#20B520')
  })

  // hide this div so we can invoke show later
  $('.connectors-div').hide()

  // listen to click on misc-table
  $('.misc-table tr').on('click', (e) => {
    $(e.currentTarget).addClass('info')
  })

  // listen to click on button in .as-table
  $('.as-table .btn').on('click', (e) => {
    e.preventDefault()
    $(e.currentTarget).addClass('btn-success').text('Changed')
  })

  // listen to input range for trigger command
  $('.trigger-input-range').on('change', (e) => {
    const $range = $(e.target)

    $range.next('p').text($range.val())
  })

  // begin: Handle our route listeners -------------

  $('.network-btn').on('click', (e) => {
    e.preventDefault()
    getComment(e)
  })

  $('.network-post').on('click', (e) => {
    e.preventDefault()
    postComment(e)
  })

  $('.network-put').on('click', (e) => {
    e.preventDefault()
    putComment(e)
  })

  $('.fixture-btn').on('click', (e) => {
    e.preventDefault()
    getComment(e)
  })
  // end -----------------------------------------

  // begin: Handle our route logic -------------
  // we fetch all data from this REST json backend
  const root = 'https://jsonplaceholder.cypress.io'

  function getComment () {
    $.ajax({
      url: `${root}/comments/1`,
      method: 'GET',
    }).then((data) => {
      $('.network-comment').text(data.body)
    })
  }

  function postComment () {
    $.ajax({
      url: `${root}/comments`,
      method: 'POST',
      data: {
        name: 'Using POST in cy.intercept()',
        email: 'hello@cypress.io',
        body: 'You can change the method used for cy.intercept() to be GET, POST, PUT, PATCH, or DELETE',
      },
    }).then(() => {
      $('.network-post-comment').text('POST successful!')
    })
  }

  function putComment () {
    $.ajax({
      url: `${root}/comments/1`,
      method: 'PUT',
      data: {
        name: 'Using PUT in cy.intercept()',
        email: 'hello@cypress.io',
        body: 'You can change the method used for cy.intercept() to be GET, POST, PUT, PATCH, or DELETE',
      },
      statusCode: {
        404 (data) {
          $('.network-put-comment').text(data.responseJSON.error)
        },
      },
    })
  }
  // end -----------------------------------------

  $('.ls-btn').on('click', (e) => {
    e.preventDefault()
    populateStorage(e)
  })

  // populate localStorage and sessionStorage to demonstrate cy.clearLocalStorage()
  function populateStorage () {
    localStorage.setItem('prop1', 'red')
    localStorage.setItem('prop2', 'blue')
    localStorage.setItem('prop3', 'magenta')

    sessionStorage.setItem('prop4', 'cyan')
    sessionStorage.setItem('prop5', 'yellow')
    sessionStorage.setItem('prop6', 'black')
  }

  // setting a cookie
  $('.set-a-cookie').on('click', (e) => {
    e.preventDefault()
    setCookies(e)
  })

  // populate local cookie to demonstrate cy.clearCookies()
  function setCookies () {
    document.cookie = 'token=123ABC'
  }

  $('.utility-jquery li').on('click', (e) => {
    let $li = $(e.currentTarget)

    $li.addClass('active')
  })

  $('#clock-div').on('click', (e) => {
    let $div = $(e.currentTarget)

    // seconds from the unix epoch
    $div.text(new Date().getTime() / 1000)
  })

  $('#tick-div').on('click', (e) => {
    let $div = $(e.currentTarget)

    // seconds from the unix epoch
    $div.text(new Date().getTime() / 1000)
  })
})
