'use strict';

const SchemaEndpointResolver = require('./utils/schemaEndpointResolver');

const InputValidationError = require('./inputValidationError'),
    apiSchemaBuilder = require('api-schema-builder');
const allowedFrameworks = ['express', 'koa'];

let schemas = {};
let middlewareOptions;
let framework;
let schemaEndpointResolver;

function init(swaggerPath, options) {
    middlewareOptions = options || {};
    const frameworkToLoad = allowedFrameworks.find((frameworkName) => {
        return middlewareOptions.framework === frameworkName;
    });

    framework = frameworkToLoad ? require(`./frameworks/${frameworkToLoad}`) : require('./frameworks/express');
    schemaEndpointResolver = new SchemaEndpointResolver();

    // build schema for requests only
    let schemaBuilderOptions = Object.assign({}, options, {buildRequests: true, buildResponses: false});
    schemas = apiSchemaBuilder.buildSchemaSync(swaggerPath, schemaBuilderOptions);
}

function validate(...args) {
    return framework.validate(_validateRequest, ...args);
}

function _validateRequest(requestOptions) {
    const paramsErrors = _validateParams(requestOptions.headers, requestOptions.params, requestOptions.query, requestOptions.files, requestOptions.path, requestOptions.method.toLowerCase());
    const bodyErrors = _validateBody(requestOptions.body, requestOptions.path, requestOptions.method.toLowerCase());
    let errors;
    if (paramsErrors || bodyErrors) {
        errors = paramsErrors && bodyErrors ? paramsErrors.concat(bodyErrors) : paramsErrors || bodyErrors;
    }
    if (errors) {
        if (middlewareOptions.errorFormatter) {
            errors = middlewareOptions.errorFormatter(errors, middlewareOptions);
        } else {
            errors = new InputValidationError(errors,
                {
                    beautifyErrors: middlewareOptions.beautifyErrors,
                    firstError: middlewareOptions.firstError
                });
        }
    }
    return errors;
}

function _validateBody(body, path, method) {
    const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method);
    if (methodSchema && methodSchema.body && !methodSchema.body.validate(body)) {
        return methodSchema.body.errors;
    }
}

function _validateParams(headers, pathParams, query, files, path, method) {
    const methodSchema = schemaEndpointResolver.getMethodSchema(schemas, path, method);
    if (methodSchema && methodSchema.parameters && !methodSchema.parameters.validate({
        query: query,
        headers: headers,
        path: pathParams,
        files: files
    })) {
        return methodSchema.parameters.errors;
    }
}

module.exports = {
    init,
    validate,
    InputValidationError
};
