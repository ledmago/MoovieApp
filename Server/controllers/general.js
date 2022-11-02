const errorHandler = require('./errorhandler');
var jwt = require('jsonwebtoken');
const config = require('../config.json');

const checkMissingParams = (array, req, res) => {
    try {
        array.forEach(key => {
            if (!req.body.hasOwnProperty(key)) {
                new errorHandler(res, 500, 1, { value: key })
                return false;
            }
        });

        return true;
    }
    catch (e) {
        // console.log(e)
    }
}
const checkLogin = async (req) => {

    try {
        const token = req.cookies.token;

        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findById(result.userId)

            if (user) {
                return user;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    catch (e) {
        return false;
    }

}

module.exports = { checkMissingParams, checkLogin, };
const User = require('../schemas/user');
const { default: axios } = require('axios');
