var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');

var YourTasks = React.createClass({
    render: function (){
        return <div>
            <table>
                <tbody>
                {taskService.tasks.map(function (item, index){
                    return <tr key={index}>
                        <td><div className="circle">{item.text}</div></td>
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

