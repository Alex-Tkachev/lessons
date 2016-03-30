var requestPromise = require("request-promise");


var task1 = "Пример текста в который нужно встав{{и}}ть пропуски. Зайчик бежал по полянке." +
    " И п{{а}}л в ямку. И {{з}}десь его ждал {{б}}обр, чтобы зак{{о}}пать." +
    " Но потом он на него {{c}}ел и зайчик здох... И пришел новый. К{{о}}нец.";

var task2 = "Пример текста в который нужно встав{{и}}ть пропуски. Зайчик бежал по полянке." +
    " И п{{а}}л в ямку. И {{з}}десь его ждал {{б}}обр, чтобы зак{{о}}пать." +
    " Но потом он на него {{c}}ел и зайчик здох... И пришел новый. К{{о}}нец.";

var tasks = [{name: "Пример 1", text: task1}, {name: "Пример 2", text: task2}]

var url = window.location.protocol + '//' + window.location.host;
requestPromise(url + '/tasks/index.txt').then(function (response) {
    var strs = response.split('\r\n');
    for (var i = 0; i < strs.length; i++) {
       requestPromise(url + '/tasks/' + strs[i]+ '.txt').then(function (response) {
           console.log(response);
       })
    }
}).catch(function (e) {
    console.log(e);
});


module.exports = {
    tasks: tasks
}