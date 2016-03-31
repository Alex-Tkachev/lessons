var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService'),
<<<<<<< HEAD
    {StateType} = require('./stateType');
=======
{StateType} = require('./stateType');
>>>>>>> planner

var YourTasks = React.createClass({
    render: function () {
        var self = this;
        return <div>
            <table>
                <tbody>
                {taskService.sortedTasks.map(function (item, index) {
                    return <tr key={index}>
                        <td>
<<<<<<< HEAD
                            <div className="circle" onClick={self.startWork.bind(self, item)}>{item.text}</div>
=======
                            <div className={self.setClassName(item)}>{item.text}</div>
>>>>>>> planner
                        </td>
                        <td>
                            <button className="form-element" onClick={self.deleteTask.bind(self, item)}>Delete</button>
                        </td>
                    </tr>
                })}
                </tbody>
            </table>
        </div>;
    },
    deleteTask: function (task) {
        taskService.deleteTask(task);
        this.forceUpdate();
    },
<<<<<<< HEAD
    startWork: function (task) {
        if (task.state == StateType.CREATED) {
            taskService.changeStateInProgress(task);
            this.forceUpdate();
        }
    }


=======
    setClassName: function (task) {
        return task.state == StateType.CREATED ? "circle" : "circleInProgress";
    }
>>>>>>> planner
});

module.exports = {
    YourTasks: YourTasks
}

