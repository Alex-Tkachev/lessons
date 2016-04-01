var React = require('react');
import Iframe from 'react-iframe';
var TaskLesson = React.createClass({
    render: function () {
        return <Iframe url="http://tut.by/" />
    }
});

module.exports = {
    TaskLesson: TaskLesson
};