var React = require('react'),
    ReactDOM = require('react-dom'),
    { TaskList } = require('./taskList'),
    { TaskText } = require('./taskText'),
    { tasks } = require('./tasks');

   
var MainForm = React.createClass({
    render: function () {
        return <div>
            <TaskList/>
            <TaskText text = {tasks[0].text}/>
        </div>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);