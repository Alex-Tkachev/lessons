var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');

var YourTasks = React.createClass({
    render: function (){
        var self = this;
        return <div>
            <table>
                <tbody>
                {taskService.sortedTasks.map(function (item, index){
                    return <tr key={index}>
                        <td><div className="circle">{item.text}</div></td>
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

