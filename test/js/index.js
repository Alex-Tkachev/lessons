var React = require('react'),
    ReactDOM = require('react-dom'),
    {TaskList} = require('./taskList'),
    {TaskText} = require('./taskText'),
    {tasks} = require('./tasks');


var MainForm = React.createClass({
    getInitialState: function () {
        return {text: ""};
    },
    setNewText: function(newText, lessonFile) {
      this.setState({text: newText, lessonFile: lessonFile})
    },
    render: function () {
        return <table className="page-root">
            <tr>
                <td><TaskList changeText={this.setNewText}/></td>
                <td><TaskText text={this.state.text}/></td>
            </tr>
        </table>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);