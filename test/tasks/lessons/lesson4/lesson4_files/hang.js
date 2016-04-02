if ($) $ (function () {

  rusHang = function (what, after, before, beforeShift) {
    var $after = $ ('#' + after)
    var $before = $ ('#' + before)
    var left = $ ('#' + what).offset ().left
    
    $placeHolder = $ ('<div>')
    $placeHolder.insertBefore ($ ('#' + what))
    
    $ (window).scroll (function () {

      after = $after.offset ().top
      before = $before.offset ().top - $ ('#' + what).height () - beforeShift
      scrollTop = document.body.scrollTop
      if (document.documentElement && document.documentElement.scrollTop) scrollTop = 
      document.documentElement.scrollTop
      /*
      if (scrollTop > before) {
        $placeHolder.css ('height', '0')
        $ ('#' + what).css ({'position': 'relative', 'left': '0', 'top': (before - after) + 'px'})
      } else
      */
      if (scrollTop > after) {
        $placeHolder.css ('height', $ ('#' + what).height ())
        $ ('#' + what).css ({'position': 'fixed', 'left': '0', 'top': '0'})
      } else {
        $placeHolder.css ('height', '0')
        $ ('#' + what).css ({'position': 'relative', 'left': '0', 'top': '0'})
      }
      fade = - (scrollTop - after) / after
      if (fade < 0) fade = 0
      if (fade > 1) fade = 1
      fade1 = (fade * 2) - 1
      if (fade1 < 0) fade1 = 0
      fade2 = (fade * 2)
      if (fade2 > 1) fade2 = 1
      c = Math.round (204 + 51 * fade2)
      $ ('#example').css ('opacity', fade1)
      $ ('#help-caller').css ('opacity', fade1)
      $ ('#title-box').css ('font-size', Math.round (70 + 30 * fade) + '%')
      $ ('#title-box').css ('padding-top', (0.35 * (1-fade)) + 'em')
//      $ ('#' + what).css ('border-bottom-color', 'rgb(' + c + ', ' + c + ', ' + c + ')')
      $ ('#' + what).css ('box-shadow', '0 1px 2px rgb(' + c + ', ' + c + ', ' + c + ')')
      c = Math.round (248 + 7 * fade2)
      $ ('#' + what).css ('background-color', 'rgb(' + c + ', ' + c + ', ' + c + ')')
    })
    $ (window).resize (function () {
      if ($ ('#' + what).css ('position') == 'fixed') {
        left = $ ('#' + what).offset ().left
        $placeHolder.css ('height', $ ('#' + what).height ())
        $ ('#' + what).css ({
          'position': 'absolute', 'left': '0', 'top': document.body.scrollTop + 'px'
        })
        $ ('#' + what).css ({'position': 'fixed', 'left': left, 'top': '0'})
      }
    })
  }
  
  //if ($.browser.safari || $.browser.chrome) {
    rusHang ('head', 'head-baulk', 'foot', 0)
  //}
  
})
