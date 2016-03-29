var React = require('react'),
    { tasks } = require('./tasks');


var TaskList = React.createClass({
    render: function () {
        return <div>
            {tasks.map(function (task, i) {
                return <div key={"task"+i}>{task.name}</div>
            })}
        </div>
    }
});

module.exports = {
    TaskList: TaskList
};

