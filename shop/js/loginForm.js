var React = require('react'),
    ReactDOM = require('react-dom'),
    { processCall } = require('./serviceCalls');

var LoginForm = React.createClass({
    getInitialState: function () {
        return {password: ""}
    },
    render: function () {
        return <div>
            <input className="form-element" placeholder='login' ref='login' key='login'/>
            <input className="form-element" placeholder='password' type="password" onChange={this.onPasswordChanged} key='password'/>
            <button className="form-element" onClick={this.login} key='action'>login</button>
        </div>;
    },
    login: function () {
        var login = ReactDOM.findDOMNode(this.refs.login).value;
        var self = this;
        var call = service.login.bind(service, login, this.state.password);
        processCall(call, function () {
            self.props.onLogin(login)
        })
    },
    onPasswordChanged: function (e) {
        this.setState({password: e.target.value})
    }
});

module.exports = {
    LoginForm: LoginForm
}
