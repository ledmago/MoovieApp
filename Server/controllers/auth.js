const User = require('../schemas/user');
var validator = require('validator');
const errorHandler = require('./errorhandler');
const { checkMissingParams, checkLogin } = require('./general');
const bcrypt = require('bcryptjs');
const config = require('../config.json');
var jwt = require('jsonwebtoken');
const Recommend = require('../schemas/recommend');
const user = require('../schemas/user');



function firstNameValidator(firstName, res) {
    const length = validator.isByteLength(firstName, { min: 2, max: 20 }) // length should be between 4 and 10
    // const regex = validator.matches(firstName, /^[a-zA-Z0-9ğüşöçİıĞÜŞÖÇ]+$/g); // should contains at least 1 char (letter)
    if (!length) new errorHandler(res, 500, 4);
    // if (!regex) new errorHandler(res, 500, 5);
    // return length && regex;
    return length
}

function lastNameValidator(lastName, res) {
    const length = validator.isByteLength(lastName, { min: 2, max: 20 }) // length should be between 4 and 10
    const regex = validator.matches(lastName, /^[a-zA-Z0-9ğüşöçİıĞÜŞÖÇ]+$/g); // should contains at least 1 char (letter)
    if (!length) new errorHandler(res, 500, 6);
    if (!regex) new errorHandler(res, 500, 7);
    return length && regex;
}
function passwordValidator(password, res) {
    const regex = validator.matches(password, /^(?=.*\d)(?=.*[a-z])(?=.*[a-zA-Z]).{8,25}$/g)
    if (!regex) new errorHandler(res, 500, 8);
    return regex;
}
async function emailValidator(email, res) {
    const isEmail = validator.isEmail(email);
    const already = await isEmailAlready(email);

    if (already) new errorHandler(res, 200, 10);
    if (!isEmail) new errorHandler(res, 200, 11);


    return !already && isEmail


}
function CapitalizeString(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase()
}

const createJWT = (email, userId) => {
    var JWT = jwt.sign({ email: email, type: 'user', userId: userId }, config.privateKey);
    return JWT;
}


async function isEmailAlready(email) {
    return await User.findOne({ email: email }) ? true : false
}

// Methods



const registerUser = async (req, res) => {


    if (!req.cookies.token) {
        const params = [
            'firstName',
            'lastName',
            'email',
            'password',
        ];

        if (!checkMissingParams(params, req, res)) return;

        let { firstName, lastName, email, password } = req.body;
        email = email.trim();
        firstName = firstName.trim();
        lastName = lastName.trim();
        const checkEmail = await User.exists({ email })
        if (checkEmail) { return res.status(200).send({ message: "Email Already Exist" }) }

        firstName = CapitalizeString(firstName);
        lastName = CapitalizeString(lastName);
        email = email.toLowerCase();
        if (
            // firstNameValidator(firstName, res) &&
            // lastNameValidator(lastName, res) &&
            // passwordValidator(password, res) &&
            await emailValidator(email, res)
        ) {



            const newUser = await new User({
                firstName,
                lastName,
                email,
                hash: bcrypt.hashSync(password, 12),
            }).save(); // Insert to database


            const token = createJWT(email, newUser._id) // Create token
            res.cookie('token', token); // set token to the cookie
            res.status(200).send({ message: "User registered successfully", token: token, user: newUser, genres: await Recommend.findOne({ user: user._id }) }) // send response;




        }


    }
    else {
        res.status(200).send({ message: "You are already logged in" });
    }







};
const logOut = async (req, res) => {

    try {
        res.clearCookie('token');
        res.status(202).send({ message: 'Log Outed Successfully' })
    }
    catch (e) {
        res.send("ok");
    }

};
const refreshToken = async (req, res) => {
    try {
        const token = req.body.token ? req.body.token : req.cookies.token;

        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ email: result.email })
            const { pushToken = "none" } = req.body


            if (user) {
                await pushTokenHandler(user._id, pushToken)
                res.cookie('token', token);
                res.status(200).send({ user: user })
            }
            else {
                new errorHandler(res, 500, 0)
            }
        }
        else {
            new errorHandler(res, 500, 0)
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }

}
const pushTokenHandler = async (userId, pushToken) => {
    if (pushToken == "none" || !pushToken) return
    const existToken = await PushTokens.exists({ userId: userId })
    if (existToken) {
        // update
        await PushTokens.deleteMany({ pushToken: pushToken });
        await PushTokens.deleteMany({ userId: userId });
    }
    // else {
    // create
    await new PushTokens({ userId: userId, pushToken: pushToken }).save();
    // }

}

const findUserByEmailOrPhone = async (text) => {
    const userByEmail = await User.findOne({ email: { $regex: new RegExp(text, "i") } });
    if (userByEmail) return userByEmail;
    const userByPhone = await User.findOne({ phone: { $regex: new RegExp(text, "i") } })
    if (userByPhone) return userByPhone;
    return false;
}
const login = async (req, res) => {

    if (await checkLogin(req) == false) {
        let { email, password } = req.body;
        email = email?.trim();
        let userByEmail = await findUserByEmailOrPhone(email);
        if (userByEmail) {
            const comparePassword = await bcrypt.compare(password, userByEmail.hash)
            const token = createJWT(userByEmail.email, userByEmail._id);
            if (comparePassword) {
                const pushToken = req.body.pushToken
                if (pushToken)
                    await pushTokenHandler(userByEmail._id, pushToken)

                res.cookie('token', token); // set token to the cookie



                res.status(200).send({ token: token, user: userByEmail, genres: await Recommend.findOne({ user: userByEmail._id }) })
            }
            else {
                new errorHandler(res, 500, 13)
            }
        }
        else {
            new errorHandler(res, 404, 13)
        }

    }
    else {
        const user = await checkLogin(req);
        res.status(200).send({ token: req.cookies.token, user: user, genres: await Recommend.findOne({ user: user._id }) })
    }



};

module.exports = {
    login,
    logOut,
    registerUser,
    refreshToken,
}