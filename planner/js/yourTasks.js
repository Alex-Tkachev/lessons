var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService'),
    {StateType} = require('./stateType');

var YourTasks = React.createClass({
    render: function () {
        var self = this;
        return <div>
            {taskService.sortedTasks.map(function (item, index) {
                return <div key={index} className={self.setClassName(item)}
                            onClick={self.startWork.bind(self, item)}>{item.text}</div>;
            })}
        </div>;
    },
    deleteTask: function (task) {
        taskService.deleteTask(task);
        this.forceUpdate();
    },
    startWork: function (task) {
        if (task.state == StateType.CREATED) {
            taskService.changeStateInProgress(task);
            this.forceUpdate();
        }
    },
    setClassName: function (task) {
        return task.state == StateType.CREATED ? "circle" : "circleInProgress";
    }
});

module.exports = {
    YourTasks: YourTasks
}

