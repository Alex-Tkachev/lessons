var React = require('react'),
    ReactDOM = require('react-dom');


var MainForm = React.createClass({
    render: function () {
	return <div>Hello, plan</div>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);