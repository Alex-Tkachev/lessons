var React = require('react'),
    ReactDOM = require('react-dom'),
    {TaskList} = require('./taskList'),

    {tasks} = require('./tasks'),
    {Task} = require('./task'),
    {TaskLesson} = require('./taskLesson');


var MainForm = React.createClass({
    getInitialState: function () {
        return {task: null};
    },
    setNewText: function (newText, lessonFile) {
        this.setState({task: {text: newText, lessonFile: lessonFile}})
    },
    render: function () {
        return <table className="page-root">
            <tbody>
            <tr>
                <td className="tdList"><TaskList changeText={this.setNewText}/></td>
                <td><Task task={this.state.task}/></td>
            </tr>
            </tbody>
        </table>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);