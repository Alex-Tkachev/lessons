var React = require('react'),
    {tasks} = require('./tasks'),
    {parseString} = require('./parseString');



var TaskText = React.createClass({
    render: function () {
        var text = parseString(this.props.text);
        return <div>
            <div>{text}</div>
        </div>
    }
});

module.exports = {
    TaskText: TaskText
};