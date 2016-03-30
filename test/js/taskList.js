var React = require('react'),
    {tasks} = require('./tasks');

var object = {
    a: 1
};
object.b = 2;
var TaskList = React.createClass({
    showText: function (text) {
        this.props.changeText(text);
    },
    render: function () {
        var self = this;
        return <div>
            {tasks.map(function (task, i) {
                return <div onClick={self.showText.bind(self, task.text)} key={"task"+i}>{task.name}</div>
            })}
        </div>
    }
});

module.exports = {
    TaskList: TaskList
};

