if ($) $ (function () {

  var lastQueryText = ''
  var lastHash = ''

  //document.rusOriginalQueryText = $ ('#spotlight').val ()
  document.rusOriginalTitle = document.title
  document.rusOriginalBodyClass404 = $ ('body').hasClass ('error-404')
  
  rusHashText = function (queryText) {
    if (/AppleWebKit/.test (navigator.userAgent) && !/Chrome/.test (navigator.userAgent)) {
      if (queryText) {
        return (
          encodeURIComponent(queryText.replace(/ /g, '_')).
          //replace(/_/g, '+').
          replace(/\%3B/g, ';').
          replace(/\%3F/g, '?').
          replace(/\%2C/g, ',').
          replace(/\%2B/g, '+')
        )
      } else {
        return ''
      }
      
    } else if (queryText) {
      return (queryText.replace (/ /g, '_'))
    }
    return queryText 
  }
  
  var originalContent = $ ('.output').html ()
  
  rusUpdateSearch = function () {
    
    if ((arguments.length > 1) && (arguments[0] == ':')) {
      $ ('#spotlight').val (arguments[1])
    }

    if (document.rusAjaxTimeout) clearTimeout (document.rusAjaxTimeout)

    document.rusAjaxTimeout = setTimeout (function () {
      var query = rusHashText ($ ('#spotlight').val ())
      //alert ('#q=' + query +'\n'+ lastHash)
      if (('#q=' + query) != lastHash) {
        if (query == '') {
          window.location.hash = ''
        } else {
          $ ('.output').fadeTo (1000, 0.33)
          $ ('.i-search').fadeOut (333)
          $ ('.i-searching').fadeIn (333)
          window.location.hash = 'q=' + query
          lastHash = '#q=' + rusHashText ($ ('#spotlight').val ())
        }
      }
    }, 333)
  }
  
  $ ('#spotlight').focus ()
  
  $ ('#spotlight').bind (
    'input change blur cut copy paste keyup keydown keypress mousedown mouseup click',
    rusUpdateSearch
  )
  
  rusExamples = [
    'ться',
    'пол',
    'нн',
    'ни',
    'жи ши',
    'шо шё',
    'е или и',
    'о е после шип',
    ', или',
    '(!)'
  ]
  
  var exampleIndex = Math.round (Math.random () * (rusExamples.length-1))
  $ ('#example a').html (rusExamples[exampleIndex])
  $ ('#example span').add ('#help-caller a').fadeIn ()
  
  $ ('.sample').click (function () {
    $ ('#spotlight').val ($ (this).html ())
    rusUpdateSearch ()
    $ ('.help-wrap').slideUp (333);
    $ ('.helpicon').removeClass ('helpicon-active'); 
    if ($ (this).hasClass ('sample-changeable')) {
      nextExampleIndex = exampleIndex
      while (nextExampleIndex == exampleIndex) {
        nextExampleIndex = Math.round (Math.random () * (rusExamples.length-1))
      }
      var nextExample = rusExamples[nextExampleIndex]
      $ (this).fadeOut (667, function () { $ (this).html (nextExample).fadeIn (333) } )
    }
    return false
  })

  $ ('#search').submit (function () { return false })
  
  $ (window).bind ('hashchange', function () {
    rusUpdateLocation ()
  })
  
  function rusUpdateLocation () {

    var locationHash = window.location.hash.substr(1);
    if (locationHash.indexOf ('q=') === 0) {
      locationHash = locationHash.substr (2)
    } else {
      locationHash = ''
    }
    newValue = decodeURIComponent (locationHash).replace (/\_/g, ' ')
    if ($('#spotlight').val () != newValue) $ ('#spotlight').val (newValue)
    var queryText = decodeURI (locationHash).replace (/\_/g, ' ')
    if (queryText == lastQueryText) return
    lastQueryText = queryText
    var xhr = 0;
  
    if (xhr) xhr.abort ()
    xhr = $.ajax ({
      type: "get",
      url: ".",
      timeout: 10000,
      data: { q: queryText, ajax: true },
      success: function (msg) {
        $ ('.i-searching').fadeOut (333)
        $ ('.i-search').fadeIn (333)
        if (queryText == '') {
          //$ ('#optional-background').fadeOut (333)
          //$ ('#header-background').show ()
          //$ ('body').css ('background', '#fff')
          $ ('.content-wrap').show ()
          $ ('.output').hide ()
          $ ('.foot-inside').show ()
          if ($ ('body').hasClass ('frontpage')) {
            $ ('h1.normal').show ()
            $ ('h1.linked').hide ()
          }
          $ ('#title-text').html ($ ('#original-title-text').html ())
          $ ('#structure').removeClass ('spotlit')
          if (document.rusOriginalTitle) {
            document.title = document.rusOriginalTitle
          }
          if (document.rusOriginalBodyClass404) {
            $ ('body').addClass ('error-404')
          }
        } else {
          $ ('.content-wrap').hide ()
          $ ('.foot-inside').hide ()
          $ ('.output').html (msg.substr (msg.indexOf (';') + 1)).show ()
          $ ('.output').stop ()
          $ ('.output').fadeTo (333, 1) //css ('opacity', 1)
          $ ('h1.normal').hide ()
          $ ('h1.linked').show ()
          $ ('body').removeClass ('error-404')
        }
      }
    })
  }

  //if ($.trim (window.location.hash) != '') {
  if (window.location.hash != '') {
    //lastHash = $.trim (window.location.hash)
    lastHash = window.location.hash
    lastQueryText = ''
    rusUpdateLocation ()
  } else {
    lastHash = ''
    lastQueryText = ''
    //window.location.hash = document.rusOriginalQueryText
  }
 

})