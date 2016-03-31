var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService'),
    {StateType} = require('./stateType');

var YourTasks = React.createClass({
    render: function () {
        var self = this;
        return <div>
            <table>
                <tbody>
                {taskService.sortedTasks.map(function (item, index) {
                    return <tr key={index}>
                        <td>
                            <div draggable="true" className={self.setClassName(item)}
                                 onDragStart={(event) => self.drag(event, item)}
                                 onClick={self.startWork.bind(self, item)}>{item.text}</div>
                        </td>
                    </tr>
                })}
                </tbody>
            </table>
            <br />
            <img onDrop={this.drop} onDragOver={this.allowDrop} src="/images/trash.png"/>
        </div>;
    },
    deleteTask: function (id) {
        taskService.deleteTaskById(id);
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
    },
    drag: function (event, task) {
        event.dataTransfer.setData("text", task.id);
    },
    drop: function (event) {
        event.preventDefault();
        var data = event.dataTransfer.getData("text");
        var id = parseInt(data);
        this.deleteTask(id);
    },
    allowDrop: function (event) {
        event.preventDefault();
    }
});

module.exports = {
    YourTasks: YourTasks
};

