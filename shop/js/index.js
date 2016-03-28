var React = require('react'),
    ReactDOM = require('react-dom'),
    {LoginForm} = require('./loginForm'),
    {HelloForm} = require('./helloForm');


var ChooseForm = React.createClass({
    getInitialState: function () {
        return {name: null}
    },
    render: function () {
        var name = this.state.name;
        if (name == null) {
            return <LoginForm onLogin = {this.onLogin} />
        }
        return <HelloForm name = {name}/>
    },
    onLogin: function (login) {
        this.setState({name: login})
    }
});

ReactDOM.render(
    <ChooseForm />,
    document.getElementById('container')
);