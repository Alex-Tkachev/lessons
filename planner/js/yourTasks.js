var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');

var YourTasks = React.createClass({
    render: function (){
        return <div>
            <table>
                <thead>
                <tr>
                    <th>Tasks</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {taskService.tasks.map(function (item, index) {
                    return <tr key={index}>
                        <td>{item.name}</td>
                        <td>{(item.date.getMonth() + 1) + "/" + item.date.getDate() + "/" + item.date.getFullYear()}</td>
                    </tr>
                })}
                </tbody>
            </table>
        </div>;
    }


});
module.exports = {
    YourTasks: YourTasks
}

