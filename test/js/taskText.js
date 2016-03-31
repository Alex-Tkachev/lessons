var React = require('react'),
    {tasks} = require('./tasks'),
    {TaskList} = require('./parseString'),
    {parseString} = require('./parseString'),
    {ChoiseBox} = require('./parseString');


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
        //this.refNames = children.refs;
        //var r = refs[0];
        //this.refs[r];
        // var ans = 0;
        // var j = 1;
        // for (var i = 0; i < re.length; i++) {
        //     if (re[i] != children[j].) {
        //         ans+=1;
        //     }
        //     j += 2;
        // }
        //

        return <div className="task-text">
            {children.result}
            <button className="butt" onClick={this.checkAnswers} key='check'>Check</button>
        </div>
    }
});

module.exports = {
    TaskText: TaskText
};