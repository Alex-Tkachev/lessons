var React = require('react'),
    {getTasks, getTask} = require('./tasks');


var TaskList = React.createClass({
    getInitialState: function () {
        var self = this;
        getTasks().then(function (taskNames) {
            self.setState({tasks: taskNames})
        });
        return {tasks: []};
    },
    showText: function (taskName, i) {
        var self = this;
        getTask(taskName).then(function (task) {
            self.setState({selectedIndex: i})
            self.props.changeText(task);
        })
    },
    render: function () {
        var self = this;
        return <div className="task-list">
            {this.state.tasks.map(function (task, i) {
                return <div className={"task" + ((i == self.state.selectedIndex) ? " selected": "")} onClick={self.showText.bind(self, task, i)} key={task}>{task}</div>
            })}
        </div>
    }
});

module.exports = {
    TaskList: TaskList
};