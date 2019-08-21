function _getParameters(req) {
    let requestOptions = {};
    let path = req.baseUrl.concat(req.route.path);
    requestOptions.path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;
    requestOptions.headers = req.headers;
    requestOptions.params = req.params;
    requestOptions.query = req.query;
    requestOptions.files = req.files;
    requestOptions.method = req.method;
    requestOptions.body = req.body;

    return requestOptions;
}

function validate(validateRequest, req) {
    let requestOptions;
    requestOptions = _getParameters(req);
    return validateRequest(requestOptions);
}

module.exports = {
    validate: validate
};
