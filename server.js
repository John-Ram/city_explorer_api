'use strict';

// packages

const express = require('express');
require('dotenv').config();
const cors = require('cors');
const {response, request} = require('express');

// global variables

const PORT = process.env.PORT || 3317;
const app = express();
app.use(cors());

// routes 

app.get('/location', (request, response) => {
  const jsonData = require('.data/location.json');
  const builtLocation = new Location(jsonData, request.query.city);
    response.send(builtLocation);
  if (request.query.city !== 'lynnwood') {
    return response.status(500).send({
      'status' : 500,
      'responseText' : 'Sorry, having trouble finding it.'
    })
  }  else {
    const builtLocation = new Location(jsonData, req.query.city);
      response.send(builtLocation);
  }
})

// functions 

function Location(jsonData,query) {
  this.search_query = query;
  this.formatted_query = jsonData[0].display_name
  this.latitude = jsonData[0].lat;
  this.longitude = jsonData[0].lon;
}

function weather(forcastObj) {
  this.forcast = forcastObj.weather.description;
  this.time = forecastObj.valid_date;
}

// server port 

app.listen(PORT, () => console.log(`you're being served port : ${PORT} a good vintage.`));