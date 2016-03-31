var React = require('react'),
{TaskText} = require('./taskText');

var Task = React.createClass({
    render: function () {
        return <div>
            <div><div>Урок</div><div>Задание</div></div>
            <div><TaskText text={this.props.text}/></div>
        </div>

    }
});

module.exports = {
    Task: Task
};