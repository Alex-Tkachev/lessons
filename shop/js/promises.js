function repeat(call) {
    return call().then(function (response) {
        return response.code == 429 ? repeat(call) : response
    });
}

function getFinalPromise(getPromise) {
    return repeat(getPromise).then(function (response) {
        if (response.code == 200) {
            return response.body
        }
        throw response.body;
    });
}

module.exports = {getFinalPromise: getFinalPromise};
