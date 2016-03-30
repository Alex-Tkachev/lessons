var React = require('react');

/* var str = "Пример текста в который нужно встав{и}ть пропуски. Зайчик бежал по полянке." +
 " И п{а}л в ямку. И {з}десь его ждал {б}обр, чтобы зак{о}пать." +
 " Но потом он на него {c}ел... И пришел новый. К{о}нец.";
 */

var ChoiseBox = React.createClass({
    render: function () {
        return <input placeholder={this.props.correctAnswer}/>
    }
});

function parseString(str) {
    str = str.replace(/{{/g, '{')
    str = str.replace(/}}/g, '}')
    var result = [];
    var i;
    var currentStr = '';
    var isInput = false;

    function addCurrentStr(isNewInput) {
        if (isInput == true) {
            result.push(<ChoiseBox key={'box'+i} correctAnswer={currentStr}/>);
        }
        else {
            result.push(currentStr);
        }
        isInput = isNewInput;
        currentStr = '';
    }

    for (i = 0; i < str.length; i++) {
        var c = str[i];
        if (c == '{') {
            addCurrentStr(true);
        } else if (c == '}') {
            addCurrentStr(false);
        }
        else {
            currentStr = currentStr + c;
        }
    }
    addCurrentStr(false);

    return result;
}

module.exports = {
    parseString: parseString
};
