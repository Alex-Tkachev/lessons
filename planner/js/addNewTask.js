var React = require('react'),
    ReactDOM = require('react-dom'),
    {taskService} = require('./taskService');

var AddNewTask = React.createClass({
    getInitialState: function () {
        return {text: "", date:""}
    },
    addTask: function () {
        var text = ReactDOM.findDOMNode(this.refs.text).value;
        var date = ReactDOM.findDOMNode(this.refs.date).value;
        this.saveToStorage(text, date);
        this.props.onSubmit();
    },
    render: function () {
        return <div>
            <input className="form-element" placeholder='Type task' ref='text'/>
            <input className="form-element" placeholder='Type date' ref='date'/>
            <button className="form-element" onClick={this.addTask}>Add</button>
        </div>
    },
    saveToStorage: function(text, date){
        var newTask = {text : text, date : date};
        taskService.addTask(newTask);
    }
});

module.exports = {
    AddNewTask: AddNewTask
}