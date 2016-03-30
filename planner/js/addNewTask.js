var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');
var Calendar = require('react-input-calendar');

var AddNewTask = React.createClass({
    addTask: function () {
        var text = ReactDOM.findDOMNode(this.refs.text).value;
        this.saveToStorage(text, this.date);
        this.props.onSubmit();
    },
    render: function () {
        return <div>
            <input className="form-element" placeholder='Type task' ref='text'/>
            <Calendar
                format="DD/MM/YYYY"
                date="1-1-2016"
                onChange={this.onSetDate}
            />
            <br/>
            <button className="form-element" onClick={this.addTask}>Add</button>
            <button className="form-element" onClick={this.back}>Back</button>
        </div>
    },
    onSetDate: function(date){
        this.date = new Date(date);

    },
    back: function(){
        this.props.comeBack();
    },
    saveToStorage: function(text, date){
        var newTask = {text : text, date : date};
        taskService.addTask(newTask);
    }
});

module.exports = {
    AddNewTask: AddNewTask
}