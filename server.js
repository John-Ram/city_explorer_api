'use strict';

// packages

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const {response, request} = require('express');
const superagent = require('superagent');
const pg = require('pg');

// global variables

const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const app = express();

// express configs

app.use(cors());
const client = new pg.Client(DATABASE_URL);
client.on('error',(error) => console.error(error));

// routes 

app.get('/location', (request, response ) =>{
  const cityQuery = req.query.city;
  const urlToSearch = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityQuery}&format=json`;

  superagent.get(urlToSearch)
    .then(resFromSuperagent => {
      const jsonData = resFromSuperagent.body;
      const builtLocation = new Location(jsonData, cityQuery);
    
      res.send(builtLocation);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send(error.message);
    })
});

app.get('/weather', (req, res) => {
  const lat = req.query.latitude;
  const lon = req.query.longitude;
  const urlToSearch = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${lat}&lon=${lon}&key=${WEATHER_API_KEY}`;

  superagent.get(urlToSearch)
    .then(resFromSuperagent => {
      const jsonData = resFromSuperagent.body;
      res.send(jsonData.data.map(forecast => new Weather(forecast)));
    })
    .catch(error => {
      console.log(error);
      res.status(500).send(error.message);
    })
});

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

// server port 
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`you're being served port : ${PORT} a good vintage.`));
});