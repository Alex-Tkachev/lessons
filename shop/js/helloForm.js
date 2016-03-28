var React = require('react'),
    { processCall, alertResponse } = require('./serviceCalls'),
    { getFinalPromise } = require('./promises');


var HelloForm = React.createClass({
    componentDidMount: function () {
        var self = this;
        processCall(service.getGoodsList.bind(service), function (responseBody) {
            self.setState({goodsList: responseBody});
        }, alertResponse);

        getFinalPromise(service.getMyOrder.bind(service)).then(function (responseBody) {
            self.setState({myOrder: responseBody})
        }, alertResponse)
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
        getFinalPromise(service.addToOrder.bind(service, "blah" + item.vendorCode))
            .then(this.updateStateField.bind(this, "myOrder"))
    },
    getInitialState: function () {
        return {goodsList: [], myOrder: {items: []}}

    },
    updateStateField: function (field, newValue) {
        var newState = {};
        newState[field] = newValue;
        this.setState(newState);
    },
    deleteItem: function (item) {
        var self = this;
        getFinalPromise(service.removeFromOrder.bind(service, item.vendorCode)).then(function (responseBody) {
            self.setState({myOrder: responseBody});
        });
    }
});

module.exports = {
    HelloForm: HelloForm
}
