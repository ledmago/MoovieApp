
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getMoovies, getGenres, setGenres, getRecommendedMoovies } = require('../controllers/recommend');

route.get('/moovies', async (req, res) => {
    await getMoovies(req, res);
});
route.get('/genres', async (req, res) => {
    await getGenres(req, res);
});
route.post('/genres', async (req, res) => {
    await setGenres(req, res);
});
route.get('/recommend', async (req, res) => {
    await getRecommendedMoovies(req, res);
});


module.exports = route;