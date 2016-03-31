var React = require('react'),
    ReactDOM = require('react-dom'),
    Calendar = require('react-input-calendar'),
    {Input, Button, ButtonGroup} = require('react-bootstrap'),
    {taskService} = require('./taskService');

var AddNewTask = React.createClass({
    getInitialState() {
        this.date = new Date("1/1/2016");
        return {date: this.date}
    },
    addTask: function () {
        var text = this.refs.text.getInputDOMNode().value;
        this.saveToStorage(text, this.date);
        this.props.onSubmit();
    },
    render: function () {
        return <div>
            <Input type="text" placeholder='Type task' ref='text'/>
            <Calendar
                format="DD/MM/YYYY"
                onChange={this.onSetDate}
                date={this.state.date}
            />
            <br/>
            <ButtonGroup>
                <Button onClick={this.addTask}>Add</Button>
                <Button onClick={this.back}>Back</Button>
            </ButtonGroup>
        </div>
    },
    onSetDate: function (date) {
        this.date = new Date(date);
    },
    back: function () {
        this.props.comeBack();
    },
    saveToStorage: function (text, date) {
        var newTask = {text: text, date: date};
        taskService.addTask(newTask);
    }

});

module.exports = {
    AddNewTask: AddNewTask
};