var React = require('react'),
    ReactDOM = require('react-dom'),
    { TaskList } = require('./taskList'),
    { TaskText } = require('./taskText'),
    { tasks } = require('./tasks');


var MainForm = React.createClass({
    getInitialState: function() {
        return {text: 'abracadabra'};
    },
    setNewText: function(newText) {
      this.setState({text: newText})
    },
    render: function () {
        return <div className="page-root">
            <TaskList changeText={this.setNewText}/>
            <TaskText text={this.state.text}/>
        </div>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);