var React = require('react'),
    ReactDOM = require('react-dom'),
    { tasks } = require('./tasks');

   
var MainForm = React.createClass({
    render: function () {
        return <div>
            {tasks.map(function (task, i) {
                return <div key={"task"+i}>{task.name}</div> 
            })}
        </div>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);