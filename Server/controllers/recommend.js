const Recommend = require('../schemas/recommend')
const { checkMissingParams, checkLogin } = require('./general');
const errorHandler = require('./errorhandler');
const Moovies = require("../consts/moovies.json")
const getMoovies = (req, res, _genres = false) => {
    const { page } = req.query;
    let genres = _genres ? _genres : req.query.genres;
    console.log("genres", _genres)
    const moovies = genres ? Moovies.movies.filter(e => e.genres.some(q => genres.includes(q))) : Moovies.movies;
    console.log("moovies", moovies?.length, page)
    res.send({
        page: page,
        hasNext: moovies?.length > (page == 0 ? 1 : page) * 9,
        moovies: moovies.slice(page * 9, (page * 9) + 9)
    })

}
const getGenres = (req, res) => {
    const { page } = req.query;
    res.send({

        genres: Moovies.genres
    })

}
const setGenres = async (req, res) => {
    console.log("Buraya girdi", req.body)
    const { genres } = req.body;
    const user = await checkLogin(req);
    if (user) {
        const isExist = await Recommend.findOne({ user: user._id })
        if (isExist) {
            console.log("Buraya girdi")
            await Recommend.findOneAndUpdate({ user: user._id }, { genres: genres })
        }
        else {
            const newRecommend = new Recommend({
                user: user._id,
                genres: genres
            })
            await newRecommend.save();
        }

        res.send({ success: true, genres: genres })
    }
    return new errorHandler(res, 500, 1, { value: "User not found" })
}

const getRecommendedMoovies = async (req, res) => {
    const user = await checkLogin(req);
    if (user) {
        const genres = await Recommend.findOne({ user: user._id })

        return getMoovies(req, res, genres?.genres)
    }
    return getMoovies(req, res)
}

module.exports = {
    getMoovies,
    getGenres,
    setGenres,
    getRecommendedMoovies
}