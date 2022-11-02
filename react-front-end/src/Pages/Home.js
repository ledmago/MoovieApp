
import '../App.css';
import './Home.css';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { AxiosGetRequest, AxiosPostRequest } from "../helpers/Request";

function Login() {




    const [genres, setGenres] = useState([]);
    const [moovies, setMoovies] = useState([]);
    const [showGenres, setShowGenres] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));
    const [selectedGenres, setSelectedGenres] = useState([]);
    const getGenres = () => {
        AxiosGetRequest('api/recommend/genres')
            .then((response) => {
                setGenres(response.data.genres)
            })
            .catch((error) => {
                console.log(error);
            })
    }

    const getMoovies = () => {
        AxiosGetRequest('api/recommend/recommend?page=' + page, Cookies.get('token'), { genres: selectedGenres })
            .then((response) => {
                setMoovies(response.data.moovies)
                setHasNext(response.data.hasNext)

            })
            .catch((error) => {
                console.log(error);
            })
    }
    const changeGenres = (e) => {

        setShowGenres(true)
        setSelectedGenres(user.genres)
    }

    const saveGenres = () => {
        AxiosPostRequest('api/recommend/genres', { genres: selectedGenres })

            .then((response) => {
                setShowGenres(false)
                const user = JSON.parse(localStorage.getItem('user'));
                user.genres = response.data.genres;
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = '?page=0'
            })
            .catch((error) => {
                console.log(error);
            })
    }
    const shortTitleHandler = (title) => {
        if (title.length > 25) {
            return title.substring(0, 20) + '...'
        }
        return title;
    }

    const handleGenreChange = (name) => {

        if (!selectedGenres.includes(name)) {
            if (selectedGenres.length > 4) return
            setSelectedGenres([...selectedGenres, name])
        } else {
            setSelectedGenres(selectedGenres.filter((genre) => genre !== name))
        }
    }
    useEffect(() => {
        getGenres()
        getMoovies()
    }, [])
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (!page) window.location.href = "/?page=0"

    if (!user.genres || showGenres) {
        return (
            <div className='main-wrapper background'>
                <div className="card g-card">
                    <div className="genre-card">
                        <div className="card-body">
                            <h5 className="card-title">Genres</h5>
                            <p className="card-text">Please select your favorite genres up to 5. Moovies will shown according to the genres you're interested in</p>
                            <div className="row genre-row" style={{ justifyContent: 'space-between' }}>
                                {genres?.map((genre, index) => {
                                    return (
                                        <div className="col-6 genre-wrapper" style={{ border: selectedGenres.includes(genre) ? '1px solid red' : '0px solid red' }} onClick={() => handleGenreChange(genre)} key={index}>
                                            <label className="form-check-label" htmlFor="flexCheckDefault">
                                                {genre}
                                            </label>
                                        </div>)
                                })
                                }

                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary save-btn" onClick={() => saveGenres()}>Save</button>
                </div>
            </div>
        )
    }

    const logOut = () => {

        AxiosGetRequest('api/auth/logout', {})

            .then((response) => {
                localStorage.removeItem('user');
                Cookies.remove('token');
                window.location.href = '/'
            })
            .catch((error) => {
                console.log(error);
            })
    }


    return (
        <div className='main-wrapper background' style={{ alignItems: 'flex-start' }}>
            <div className="moovie-wrapper">

                <div className='paginatin-buttons'>
                    <button className="btn btn-warning save-btn" onClick={() => changeGenres()}>Change Genres</button>
                    <button className="btn btn-warning save-btn" onClick={() => logOut()}>Log Out</button>
                </div>


                <div className='row moovie-row'>
                    {
                        moovies?.map((moovie, index) => {
                            return (
                                <div className="col-3  moovie-card mr-5">

                                    <img className='poster' src={moovie.posterUrl}
                                        onError={event => {
                                            event.target.src = "https://media.istockphoto.com/vectors/error-404-page-not-found-vector-id673101428?k=20&m=673101428&s=170667a&w=0&h=sifFCXQls5ygak3Y-II0cI1tibgQZVyPWzpLHtHKOGg="
                                            event.onerror = null
                                        }}
                                    />
                                    <div className='moovie-information'>
                                        <div className='moovie-description'>

                                            {moovie.plot}
                                            <h5 style={{ marginTop: 20, marginLeft: 15 }}>Genres</h5>
                                            <ul style={{ listStyle: 'none' }}>
                                                {moovie.genres?.map(e => <li >{e}</li>)}
                                            </ul>
                                        </div>

                                        <div className='moovie-title'>
                                            {shortTitleHandler(moovie.title)}
                                        </div>

                                    </div>
                                </div>

                            )
                        })

                    }
                </div>
                <div className='paginatin-buttons'>
                    <button className="btn btn-primary save-btn" disabled={page < 1} onClick={() => window.location.href = '?page=' + (Number(page) - 1)}>Previous Page</button>
                    <button className="btn btn-primary save-btn" disabled={!hasNext} onClick={() => window.location.href = '?page=' + (Number(page) + 1)}>Next Page</button>
                </div>
            </div>
        </div>
    );
}

export default Login;
