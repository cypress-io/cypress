// This pulls the email address out of the query string to tell ActiveCampaign who the visitor is. Like, if they get sent to docs.cypress.io?e=person@domain.com
(function () {
  function GetUrlValue (VarSearch) {
    var SearchString = window.location.search.substring(1)
    var VariableArray = SearchString.split('&')

    for (var i = 0; i < VariableArray.length; i++) {
      var KeyValuePair = VariableArray[i].split('=')

      if (KeyValuePair[0] === VarSearch) {
        return KeyValuePair[1]
      }
    }
  }

  var email = GetUrlValue('e')
  var trackcmp_email = (typeof (email) !== 'undefined') ? email : ''
  var trackcmp = document.createElement('script')

  trackcmp.async = true
  trackcmp.type = 'text/javascript'
  trackcmp.src = '//trackcmp.net/visit?actid=798603841&e=' +
    encodeURIComponent(trackcmp_email) + '&r=' +
    encodeURIComponent(document.referrer) + '&u=' +
    encodeURIComponent(window.location.href)

  var trackcmp_s = document.getElementsByTagName('script')

  if (trackcmp_s.length) {
    trackcmp_s[0].parentNode.appendChild(trackcmp)
  } else {
    var trackcmp_h = document.getElementsByTagName('head')
    trackcmp_h.length && trackcmp_h[0].appendChild(trackcmp)
  }
})();
