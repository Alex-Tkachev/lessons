var React = require('react'),
    {tasks} = require('./tasks'),
    {parseString} = require('./parseString');


var TaskText = React.createClass({
    render: function () {
        var text = parseString(this.props.text);
        return <div className="task-text">
            {text}
        </div>
    }
});

module.exports = {
    TaskText: TaskText
};