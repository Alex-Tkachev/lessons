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
    showText: function (task, i) {
        var self = this;
        getTask(task.taskFile).then(function (taskText) {
            self.props.changeText(taskText, task.lessonFile);
            self.setState({selectedIndex:i })
        })
    },
    render: function () {
        var self = this;
        return <div className="task-list">
            {this.state.tasks.map(function (task, i) {
                return <div className={"task" + ((i == self.state.selectedIndex) ? " selected": "")}
                            onClick={self.showText.bind(self, task, i)} key={task.lessonFile}>{task.name}</div>
            })}
        </div>
    }
});

module.exports = {
    TaskList: TaskList
};