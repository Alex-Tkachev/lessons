var React = require('react'),
    {tasks} = require('./tasks');

var TaskList = React.createClass({
    showText: function (text) {
        this.props.changeText(text);
    },
    render: function () {
        var self = this;
        return <div className="task-list">
            {tasks.map(function (task, i) {
                return <div className="task" onClick={self.showText.bind(self, task.text)} key={"task"+i}>{task.name}</div>
            })}
        </div>
    }
});

module.exports = {
    TaskList: TaskList
};