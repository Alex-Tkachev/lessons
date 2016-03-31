var React = require('react'),
    ReactDOM = require('react-dom'),
    {TaskList} = require('./taskList'),
    
    {tasks} = require('./tasks'),
    {Task} = require('./task'),
    {TaskLesson} = require('./taskLesson');


var MainForm = React.createClass({
    getInitialState: function () {
        return {text: ""};
    },
    setNewText: function (newText) {
        this.setState({text: newText})
    },
    render: function () {
        return <table className="page-root">
            <tbody>
            <tr>
                <td><TaskList changeText={this.setNewText}/></td>
                <td><Task text={this.state.text}/></td>
            </tr>
            </tbody>
        </table>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);