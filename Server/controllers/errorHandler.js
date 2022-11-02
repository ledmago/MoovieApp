const errors = require('../errors.json');
module.exports = class ErrorHandler {

    codeHandler(code) {
        if (errors[code]) {
            this.message.message = errors[code];
        }
        else {
            this.message.message = errors[0];
        }
        return this.message;
    }

    constructor(res, status, code, extradata = null) {
        this.message = {};
        this.message.code = code;
        if (code == -1) {
            res.clearCookie("token");
        }
        this.message.status = status;
        if (extradata) { this.message = { ...this.message, ...extradata } }
        res.status(status).send(this.codeHandler(code));


    }




}