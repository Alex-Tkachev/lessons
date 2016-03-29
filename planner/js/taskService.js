class TaskService {
    constructor() {
        console.log("constructor");
        this._setTasks();
    }

    _setTasks() {
        var tasks = [{
            text: "Test", date: new Date()
        }, {text: "Test 2", date: new Date()},
            {text: "Test 3", date: new Date()}];
        this._tasks = tasks;
        /*if(){
         get from localStorage
         }*/
    }

    get tasks() {
        return this._tasks;
    }

    addTask(newTask) {
        this._tasks.push(newTask);
        var newTasks = JSON.stringify(this._tasks);
        localStorage.setItem("tasks", newTasks);
    }

}

module.exports = {
    taskService: new TaskService()
};