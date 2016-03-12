function repeatCall(call, callBack) {
    console.log("qwe")
    call(function (error, response) {
        if (error != null || response == null) {
            return callBack(error, response)
        }
        if (response.code == 429) {
            return repeatCall(call, callBack)
        }
        callBack(error, response)
    })
}

function processCall(call, successCallBack, failCallBack) {
    repeatCall(call, function (error, response) {
        if (error != null || response == null) {
            return failCallBack("There is error here")
        }
        if (response.code == 200) {
            return successCallBack(response.body)
        }
        failCallBack(response.body)
    })
}

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
        }, function (responseBody) {
            alert(responseBody)
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
        var self = this;
        return <div>
        {'Hello ' + this.props.name + '!'}
            <table>
                <tbody>
                {this.state.goodsList.map(function (item) {
                    return <tr key={item.name} onClick={self.orderItem.bind(self, item)}>
                        <td>{item.name}</td>
                        <td>{item.price}</td>
                    </tr>
                })}
                </tbody>
            </table>
            <hr/>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                {this.state.myOrder.items.map(function (item) {
                    return <tr key={item.name} onClick={self.deleteItem.bind(self, item)}>
                        <td>{item.name}</td>
                        <td>{item.price}</td>
                        <td>{item.count}</td>
                    </tr>
                })}
                </tbody>
            </table>
            <div>Total Price: {this.state.myOrder.totalPrice}</div>
        </div>;
    },
    orderItem: function (item) {
        var self = this;
        var promise = service.addToOrder(item.vendorCode);
        promise.then(function (result, response) {
            if (result.code != 200) {
                return
            }
            self.setState({myOrder: result.body});
        })
    },
    getInitialState: function () {
        return {goodsList: [], myOrder: {items: []}}

    },
    deleteItem: function (item) {
        var self = this;
        var promise = service.removeFromOrder(item.vendorCode);
        promise.then(function (result, response) {
            if (result.code != 200) {
                return
            }
            self.setState({myOrder: result.body});
        })

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