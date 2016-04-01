var React = require('react'),
    {StateType} = require('./stateType');

class TaskService {
    constructor() {
        this._setTasks();
    }

    _setTasks() {
        var oldTasks = JSON.parse(localStorage.getItem("tasks"));
        if (oldTasks == null || oldTasks.length == 0) {
            oldTasks = [];
            this.nextID = 0;
        } else {
            this.nextID = oldTasks[oldTasks.length - 1].id + 1;
        }
        
        oldTasks = oldTasks.map(item => {
            item.date = new Date(item.date);
            return item;
        });


        this._tasks = oldTasks;
    }

    get tasks() {
        return this._tasks;
    }

    addTask(newTask) {
        newTask.state = StateType.CREATED;
        newTask.id = this.nextID;
        this.nextID += 1;
        this._tasks.push(newTask);
        var newTasks = JSON.stringify(this._tasks);
        localStorage.setItem("tasks", newTasks);
    }


    deleteTask(task) {
        var index = this._tasks.indexOf(task);
        if (index != -1) {
            this._tasks.splice(index, 1);
            var newTasks = JSON.stringify(this._tasks);
            localStorage.setItem("tasks", newTasks);
        }
    }

    get sortedTasks (){
        var arr = this._tasks.slice();
        arr = arr.sort(function(a, b){
            return a.date.getTime() > b.date.getTime();
        });
        return arr;

    }

    changeStateInProgress (task){
        var index = this._tasks.indexOf(task);
        if (index != -1) {
            this._tasks[index].state = StateType.IN_PROGRESS;
            var newTasks = JSON.stringify(this._tasks);
            localStorage.setItem("tasks", newTasks);
        }
    }

    severalFirstSortedTasks (number){
        var arr = this._tasks.slice();
        arr = arr.sort(function(a, b){
            return a.date.getTime() > b.date.getTime();
        });
        arr =  arr.slice(0, number);
        return arr;

    }


}

module.exports = {
    taskService: new TaskService()
};