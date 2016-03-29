var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');

var YourTasks = React.createClass({
    render: function (){
        console.log(taskService.tasks);
        return <div>
            Dasha
        </div>
    }
});

module.exports = {
    YourTasks: YourTasks
}
