var requestPromise = require("request-promise");

var url = window.location.protocol + '//' + window.location.host;
requestPromise(url + '/tasks/index.txt').then(function (response) {
        var strs = response.split('\r\n');
        for (var i = 0; i < strs.length; i++) {
            requestPromise(url + '/tasks/' + strs[i]+ '.txt').then(function (response) {
                console.log(response);
            })
        }
}).catch(function (e) {
    console.log(e);
});


function getTasks() {
    return requestPromise(url + '/tasks/index.txt').then(function (response) {
        return response.split('\r\n');
    });
}

function getTask(taskName) {
    return requestPromise(url + '/tasks/' + taskName + '.txt');
}

module.exports = {
    getTasks: getTasks,
    getTask: getTask
}