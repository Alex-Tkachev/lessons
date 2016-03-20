function repeatCall(call, callBack) {
    call(function (error, response) {
        if (error != null || response == null) {
            return callBack(error, response)
        }
        if (response.code == 429) {
            return repeatCall(call, callBack)
        }
        callBack(error, response)
    })
}

function processResponse(successCallBack, failCallBack) {
    return function (error, response) {
        if (error != null || response == null) {
            return failCallBack("There is error here")
        }
        if (response.code == 200) {
            return successCallBack(response.body)
        }
        failCallBack(response.body)
    }
}

function processCall(call, successCallBack, failCallBack) {
    failCallBack = failCallBack || alertResponse;
    repeatCall(call, processResponse(successCallBack, failCallBack))
}

function alertResponse(responseBody) {
    alert(responseBody);
}

module.exports = {
    processCall: processCall,
    alertResponse: alertResponse
};

