var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');

var YourTasks = React.createClass({
    render: function (){
        var self = this;
        return <div>
            <table>
                <thead>
                <tr>
                    <th>Tasks</th>
                    <th>Date</th>
                </tr>
                </thead>
                <tbody>
                {taskService.sortedTasks.map(function (item, index) {
                    return <tr key={index}>
                        <td>{item.text}</td>
                        <td>{(item.date.getMonth() + 1) + "/" + item.date.getDate() + "/" + item.date.getFullYear()}</td>
                        <td><button className="form-element" onClick={self.deleteTask.bind(self, item)}>Delete</button> </td>
                    </tr>
                })}
                </tbody>
            </table>
        </div>;
    },
    deleteTask: function(task){
        taskService.deleteTask(task);
        this.forceUpdate();
    }
    



});
module.exports = {
    YourTasks: YourTasks
}

