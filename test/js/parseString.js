var React = require('react');
var ReactDOM = require('react-dom');

/* var str = "Пример текста в который нужно встав{и}ть пропуски. Зайчик бежал по полянке." +
 " И п{а}л в ямку. И {з}десь его ждал {б}обр, чтобы зак{о}пать." +
 " Но потом он на него {c}ел... И пришел новый. К{о}нец.";
 */

var ChoiseBox = React.createClass({
    getInitialState : function () {
        return {value : '', className : ''}
    },
    isValid: function () {
        var bol = ReactDOM.findDOMNode(this.refs.inp).value == this.props.correctAnswer;
         if(!bol) {
             this.setState({className : 'errlighted'});
         }
        else {
             this.setState({className : 'corlighted'});
         }
        return bol;
    },
    render: function () {
        return <input value={this.state.value} className={this.state.className} onKeyPress={this.handleChange} ref="inp"/>
    },
    handleChange : function (event) {
        this.setState({value : String.fromCharCode(event.which), className : ''});
    }
});

function parseString(str) {
    str = str.replace(/{{/g, '{');
    str = str.replace(/}}/g, '}');
    var result = [];
    var i;
    var currentStr = '';
    var isInput = false;
    var refs = [];

    function addCurrentStr(isNewInput) {
        if (isInput == true) {
            result.push(<ChoiseBox ref={"box"+i} key={"box" + i} correctAnswer={currentStr}/>);
            refs.push("box" + i);
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


    return {refs: refs, result : result};
}

module.exports = {
    parseString: parseString,
    ChoiseBox : ChoiseBox
};
