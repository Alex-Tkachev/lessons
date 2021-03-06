class TaskService {
    constructor() {
        console.log("constructor");
        this._setTasks();
        this.deleteTask(this._tasks[1]);
    }

    _setTasks() {
        var oldTasks = JSON.parse(localStorage.getItem("tasks"));
        if (oldTasks == null) {
            oldTasks = [];
            this.nextID = 0;
        }
        else {
            this.nextID = oldTasks[oldTasks.length - 1].id + 1;
        }
        this._tasks = oldTasks;
        //console.log(oldTasks);
    }

    get tasks() {
        return this._tasks;
    }

    addTask(newTask) {
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


}

module.exports = {
    taskService: new TaskService()
};