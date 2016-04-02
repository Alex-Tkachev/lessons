var requestPromise = require("request-promise");

var url = window.location.protocol + '//' + window.location.host + "/test";




function getTasks() {
    return requestPromise(url + '/tasks/index.txt').then(function (response) {
        return response.split('\r\n').map(function(task){
            task = JSON.parse(task);
            task.lessonFile = url + "/tasks/" + task.lessonFile;
            return task;
        });
    })
}

function getTask(taskName) {
    return requestPromise(url + '/tasks/' + taskName + '.txt');
}

module.exports = {
    getTasks: getTasks,
    getTask: getTask
}