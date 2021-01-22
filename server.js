'use strict';

// packages

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const {response, request} = require('express');

// global variables

const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
const app = express();


// express configs

app.use(cors());
const client = new pg.Client(DATABASE_URL);
client.on('error',(error) => console.error('db error', error));

// routes 
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);

function getLocation(request, response ) {
  console.log('get location');
  console.log(request.query.city);
  const cityQuery = request.query.city;
  // client.query(`SELECT * FROM locations WHERE search_query=${cityQuery};`)
  //   .then(resultFromSql => {
  //     if (resultFromSql.rowCount) {
  //       console.log(`found city: ${cityQuery} ... responding with DB location`);
  //       response.status(200).send(resultFromSql.rows[0]);
  //     } else {
  //       console.log(`city <${cityQuery}> not found in DB`);
        const urlToSearch = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityQuery}&format=json&limit=1`;

  superagent.get(urlToSearch)
    .then(resFromSuperagent => {
      console.log('retrieved location from API, sending to client and caching in DB');
      const jsonData = resFromSuperagent.body;
      response.send(new Location(jsonData, cityQuery));
      const insertQuery = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);`;
            const valueArray = [cityQuery, jsonData[0].display_name, jsonData[0].lat, jsonData[0].lon];
            client.query(insertQuery, valueArray);
    })
//   }
// })
  .catch(error => errorHandler(error, response));
}

 function getWeather (request, response) {
  const lat = request.query.latitude;
  const lon = request.query.longitude;
  const urlToSearch = `http://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`;

  superagent.get(urlToSearch)
    .then(responseFromSuperagent => {
      const jsonData = responseFromSuperagent.body;
      response.send(jsonData.data.map(forecast => new Weather(forecast)).slice(0,8));
    })
    .catch(error => errorHandler(error, response));
}

function getYelp(request, response){
  console.log(request.query);
  const limit = 5;
  const term = 'restaurant';
  const offset = limit * request.query.page - limit;
  const yelpQuery = `http://api.yelp.com/v3/businesses/search?latitude=${request.query.latitude}&longitude=${request.query.longitude}&limit=${limit}&term=${term}&offset=${offset}`;

  superagent.get(yelpQuery)
  .set('Authorization', `Bearer ${YELP_API_KEY}`)
  .then(yelpResponse => {
    response.send(yelpResponse.body.businesses.map(restaurant => new Yelp(restaurant)));
  })
  .catch(error => errorHandler(error, response));
}

function getMovies(request, response) {

  const movieApiUrl = `http://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${request.query.search_query}&page=1&include_adult=false`;


  superagent.get(movieApiUrl)
    .then(movieApiResult => {
      response.send(movieApiResult.body.results.map(movie => new Movie(movie)));
    })
    .catch(error => errorHandler(error, response));
}



// functions 

function Location(jsonData,query) {
  this.search_query = query;
  this.formatted_query = jsonData[0].display_name
  this.latitude = jsonData[0].lat;
  this.longitude = jsonData[0].lon;
}

function Weather(forecastObj) {
  this.forecast = forecastObj.weather.description;
  this.time = forecastObj.valid_date;
}

function Yelp(yelpObj) {
  this.name = yelpObj.name;
  this.image_url = yelpObj.image_url;
  this.price = yelpObj.price;
  this.rating = yelpObj.rating;
  this.url = yelpObj.url;
}

function Movie(movieObj) {
  this.title = movieObj.title;
  this.overview = movieObj.overview;
  this.average_votes = movieObj.vote_average;
  this.total_votes = movieObj.vote_count;
  this.image_url = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/' + movieObj.poster_path;
  this.popularity = movieObj.popularity;
  this.released_on = movieObj.release_date;
}

const errorHandler = (error, response) => {
  console.log(error);
  response.status(500).send(error.message);
}
// server PORT 
// client.connect()
//   .then(() => {
    app.listen(PORT, () => console.log(`you're being served port : ${PORT} a good vintage.`));
// }).catch(error => console.log('!!!!!!!!!!!!!!!!!!!!!!!!', error));