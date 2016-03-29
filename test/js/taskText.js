var React = require('react'),
    { tasks } = require('./tasks');


var TaskText = React.createClass({
    render: function () {
        return <div>
            {this.props.text}
        </div>
    }
});

module.exports = {
    TaskText: TaskText
};