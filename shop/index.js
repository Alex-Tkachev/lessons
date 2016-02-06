var LoginForm = React.createClass({
    getInitialState: function () {
        return {password: ""}
    },
    render: function () {
        return <div>
            <input placeholder='login' ref='login' key='login'/>
            <input placeholder='password' type="password" onChange={this.onPasswordChanged} key='password'/>
            <button onClick={this.login} key='action'>login</button>
        </div>;
    },
    login: function () {
        var login = ReactDOM.findDOMNode(this.refs.login).value;
        var self = this;
        service.login(login, this.state.password, function (error, response) {
            if (response.code == 200) {
                self.props.onLogin(login)
                return
            }

            alert("Who are you?")
        })
    },
    onPasswordChanged: function (e) {
        this.setState({password: e.target.value})
    }
});
var HelloForm = React.createClass({
    componentDidMount: function () {
        var self = this;
        service.getGoodsList(function (jsError, response) {
            if (jsError != undefined && response.code != 200) {
                return
            }
            self.setState({goodsList: response.body})
        })
        service.getMyOrder().then(function (result, response) {
            if (result.code != 200) {
                return
            }
            self.setState({myOrder: result.body});
        })

    },
    render: function () {
        return <div>
        {'Hello ' + this.props.name + '!'}
        {this.state.goodsList.map(function (item) {
            return <div key={item.name}>{item.name}</div>
        })}
            <hr/>
        {this.state.myOrder.items.map(function (item) {
            return <div key={item.name}>{item.name}</div>
        })}
        </div>;
    },
    getInitialState: function () {
        return {goodsList: [], myOrder: {items: []}}

    }
});

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