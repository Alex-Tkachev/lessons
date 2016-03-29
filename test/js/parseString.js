var React = require('react'),
    ReactDOM = require('react-dom');

var str = "Пример текста в который нужно встав{{и}}ть пропуски. Зайчик бежал по полянке." +
    " И п{{а}}л в ямку. И {{з}}десь его ждал {{б}}обр, чтобы зак{{о}}пать." +
    " Но потом он на него {{c}}ел и зайчик здох... И пришел новый. К{{о}}нец.";
var answers = [];
//var i
var j = 0;
for(i = 0; i < str.length-1; i++) {
    if (str[i - 1] == '{' && str[i + 1] == '}') {
        answers[j] = str[i];
        j = j + 1;
    }
    else if (str[i] != '{' && str[i] != '}') {
    console.log(str[i]);
}}

}
ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);
