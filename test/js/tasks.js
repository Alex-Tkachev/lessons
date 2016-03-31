var requestPromise = require("request-promise");

var url = window.location.protocol + '//' + window.location.host;




function getTasks() {
    return requestPromise(url + '/tasks/index.txt').then(function (response) {
        return response.split('\r\n').map(JSON.parse);
    })
}

function getTask(taskName) {
    return requestPromise(url + '/tasks/' + taskName + '.txt');
}

module.exports = {
    getTasks: getTasks,
    getTask: getTask
}