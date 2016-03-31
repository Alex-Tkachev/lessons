var React = require('react'),
    {parseString} = require('./parseString');


var TaskText = React.createClass({
    getInitialState : function () {
        return {refs : []};
    },
    checkAnswers: function () {
        var count = 0;
        for(var i = 0; i < this.state.refs.length; i++) {
          if(!this.refs[this.state.refs[i]].isValid()){
              count++;
          }
        }
         alert('Количество ваших ошибок: ' + count);
    },
    render: function () {

        var children = parseString(this.props.text);
        this.state.refs = children.refs;

        return <div className="task-text">
            <div>
                {children.result}
            </div>
            <button className="butt" onClick={this.checkAnswers} key='check'>Check</button>
        </div>
    }
});

module.exports = {
    TaskText: TaskText
};