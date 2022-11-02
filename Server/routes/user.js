

const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();

const { changeUserProfile, getUser, changePassword, forgetPassword } = require('../controllers/usercontroller');



route.post('/changepassword', async (req, res) => {
    await changePassword(req, res);
});


route.post('/forgetpassword', async (req, res) => {
    await forgetPassword(req, res);
});


route.post('/changeprofile', async (req, res) => {
    await changeUserProfile(req, res);
});

route.get('/', async (req, res) => {
    await getUser(req, res);
});





module.exports = route;