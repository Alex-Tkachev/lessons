var React = require('react'),
    {TaskText} = require('./taskText'),
    {TaskLesson} = require('./taskLesson');

var Task = React.createClass({
    getInitialState: function () {
        return {showTask: false};
    },
    lessons: function () {
        this.setState({showTask: false});
    },
    exercises: function () {
        this.setState({showTask: true});
    },
    render: function () {
        if(this.props.task == null) {
            return <div>Выберите урок</div>
        }
        return <div>
            <table>
                <tbody>
                <tr>
                    <td>
                        <div className={"lesson" + (this.state.showTask ? "" : " selected")} onClick={this.lessons}>
                            Урок
                        </div>
                    </td>
                    <td>
                        <div className={"exercise" + (this.state.showTask ? " selected" : "")}
                             onClick={this.exercises}>
                            Задание
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
            <div>{this.state.showTask ? <TaskText text={this.props.task.text}/> : <TaskLesson lesson={this.props.task.lessonFile}/>}</div>
        </div>

    }
});


module.exports = {
    Task: Task
};