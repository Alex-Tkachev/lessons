var StateTime = {
    OVERDUE : 1,
    IN_PROGRESS : 0,
    FUTURE : 2
}

module.exports = {
    StateTime: StateTime
};


/*changeStateByTime (task) {
 var index = this._tasks.indexOf(task);
 if (index != -1) {
 var today = new Date();
 if (this._tasks[index].date.getTime() < today.getTime()){
 this._tasks[index].timeState = StateTime.OVERDUE;
 }
 var newTasks = JSON.stringify(this._tasks);
 localStorage.setItem("tasks", newTasks);
 }
 }

 changeStateInProgress (task){
 var index = this._tasks.indexOf(task);
 if (index != -1) {
 this._tasks[index].state = StateType.IN_PROGRESS;
 this._tasks[index].timeState = StateTime.IN_PROGRESS;
 var newTasks = JSON.stringify(this._tasks);
 localStorage.setItem("tasks", newTasks);
 }
 }

 addTask(newTask) {
 newTask.state = StateType.CREATED;
 newTask.timeState = StateTime.FUTURE;
 newTask.id = this.nextID;
 this.nextID += 1;
 this._tasks.push(newTask);
 var newTasks = JSON.stringify(this._tasks);
 localStorage.setItem("tasks", newTasks);
 }

 //this._tasks.changeStateByTime(this._tasks[1]);
 */