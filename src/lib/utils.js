/*global $*/

const clearActiveSpec = () => {
  $('.all-tests.active')
  .removeClass('active')
    .find('i')
      .removeClass()
      .addClass('fa fa-play')
  $('.file>a.active')
    .removeClass('active')
      .find('i')
        .removeClass()
        .addClass('fa fa-file-code-o fa-fw')
}

export {
  clearActiveSpec,
}
