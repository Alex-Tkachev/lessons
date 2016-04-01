var React = require('react'),
    {taskService} = require('./taskService'),
    {StateType} = require('./stateType'),
    {Row, Col} = require('react-bootstrap');

var YourTasks = React.createClass({
    render: function () {
        var tasks = taskService.sortedTasks;
        var tasksView = [];
        var colSize = 3;
        for (var i = 0; i < tasks.length; i = i + colSize) {
            var row = [];
            for (var j = 0; (j < colSize) && (i + j < tasks.length); j++) {
                var index = i + j;
                const task = tasks[index];
                var col = <Col xs={4} key={index}>
                    <div draggable="true" className={this.setClassName(task)}
                         onDragStart={(event) => this.drag(event, task)}
                         onClick={() => this.startWork(task)}>{task.text}</div>
                </Col>;
                row.push(col);
            }

            var rowView = <Row key={i + '_row'} className="top-buffer">{row}</Row>;
            tasksView.push(rowView);
        }

        return <div>
    render: function () {
        var tasks = taskService.sortedTasks;
        var tasksView = [];
        var colSize = 3;
        for (var i = 0; i < tasks.length; i = i + colSize) {
            var row = [];
            for (var j = 0; (j < colSize) && (i + j < tasks.length); j++) {
                var index = i + j;
                const task = tasks[index];
                var col = <Col xs={4} key={index}>
                    <div draggable="true" className={this.setClassName(task)}
                         onDragStart={(event) => this.drag(event, task)}
                         onClick={() => this.startWork(task)}>{task.text}</div>
                </Col>;
                row.push(col);
            }

            var rowView = <Row key={i + '_row'} className="top-buffer">{row}</Row>;
            tasksView.push(rowView);
        }

        return <div>
            {tasksView}
            <br />
            <img onDrop={this.drop} onDragOver={this.allowDrop} src="/images/trash.png" width="40px"/>



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

