var React = require('react'),
    ReactDOM = require('react-dom'),
    {AddNewTask} = require('./addNewTask'),
    {YourTasks} = require('./yourTasks'),
    {taskService} = require('./taskService'),
    {Grid, Row, Col, Well, Button} = require('react-bootstrap');


var MainForm = React.createClass({
    getInitialState: function () {
        return {mainView: true}
    },
    viewAddTasks: function () {
        this.setState({mainView: false});
    },
    onSubmit: function () {
        this.setState({mainView: true});
    },
    comeBack: function () {
        this.setState({mainView: true});
    },
    render: function () {
        var view;
        if (this.state.mainView) {
            view = <div><YourTasks />
                <br />
                <Button onClick={this.viewAddTasks}>Add Task</Button>
            </div>;
        }
        else {
            view = <AddNewTask onSubmit={this.onSubmit} comeBack={this.comeBack}/>;
        }

        return <Grid>
            <Row>
                <Col xs={5}>
                    <Well>
                        {view}
                    </Well>
                </Col>
            </Row>
        </Grid>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);