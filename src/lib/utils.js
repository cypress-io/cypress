/*global $*/

const clearRunAllActiveSpec = () => {
  $('.all-tests.active')
  .removeClass('active')
    .find('i')
      .removeClass()
      .addClass('fa fa-play')
}

export {
  clearRunAllActiveSpec,
}
