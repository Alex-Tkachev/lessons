var React = require('react');
import Iframe from 'react-iframe';
var TaskLesson = React.createClass({
    render: function () {
        return <Iframe url={this.props.lesson}/>
    }
});

module.exports = {
    TaskLesson: TaskLesson
};