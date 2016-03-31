var React = require('react'),
    ReactDOM = require('react-dom'),
    {AddNewTask} = require('./addNewTask'),
    {YourTasks} = require('./yourTasks'),
    {taskService} = require('./taskService');


var MainForm = React.createClass({
    getInitialState: function () {
        return {mainView: true}
    },
    viewAddTasks: function () {
        this.setState({mainView: false});
    },
    onSubmit: function(){
        this.setState({mainView: true});
    },
    comeBack: function() {
        this.setState({mainView: true});
    },
    render: function () {
        var view;
        if(this.state.mainView){
            view =<div> <YourTasks />
                <br />
                <button className="form-element" onClick={this.viewAddTasks}>Add Task</button>
                </div>;
        }
        else{
            view = <AddNewTask onSubmit={this.onSubmit} comeBack={this.comeBack}/>;
        } 
            
        return <div>
            {view}
        </div>
    }
});

ReactDOM.render(
    <MainForm />,
    document.getElementById('container')
);