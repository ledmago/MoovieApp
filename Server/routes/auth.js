
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { login, registerUser, logOut, refreshToken } = require('../controllers/auth');

route.post('/login', async (req, res) => {
    await login(req, res);
});
route.post('/register', async (req, res) => {
    await registerUser(req, res);
});
route.get('/logout', async (req, res) => {
    await logOut(req, res);
});
route.post('/refreshtoken', async (req, res) => {
    await refreshToken(req, res);
});

module.exports = route;