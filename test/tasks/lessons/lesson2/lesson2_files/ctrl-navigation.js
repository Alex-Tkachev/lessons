e2_ctrl_navi = function (event) {
  if (window.event) event = window.event
  var target = event.target ? event.target.tagName : event.srcElement ? event.srcElement.tagName : ''
  //if (/textarea|input/i.test (target)) return
  if (event.ctrlKey) {
    var link = null
    if (37 == event.keyCode) link = document.getElementById ('link-prev')
    if (39 == event.keyCode) link = document.getElementById ('link-next')
    if (link && link.href) location.href = link.href
  }
}

if (document.addEventListener) {
  document.addEventListener ('keyup', e2_ctrl_navi, false)
}
else
if (document.attachEvent) {
  document.attachEvent ('onkeydown', e2_ctrl_navi)
}