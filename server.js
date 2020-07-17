'use strict';
/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: setting everyhign up and isntall via command line

  ############################################################################################

GLOBAL AND SETTUP





  ############################################################################################

*/



const express = require('express');
const app = express();
require('dotenv').config();

const cors = require('cors');
app.use(cors());

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
  console.log('ERROR', err);
});

/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: lets make everyhting set from the env and make them variables on this file
  nothing should show but placeholders
  ############################################################################################

PATHS

  ############################################################################################

*/
const superagent = require('superagent');
// define PORT as the port value in our .env. if anything is wrong with our .env or dotenv, assign port 3001
const PORT = process.env.PORT || 3001;
const GEO_DATA_API_KEY = process.env.GEO_DATA_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const HIKE_API_KEY = process.env.HIKE_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;

/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: setting everyhign was getting error due to env file
*/

app.get('/location', locationHandler);

app.get('/weather', weatherHandler);

app.get('/trails', trailsHandler);

app.get('/movies', movieHandler);

/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: paths defined, lets go in.


console.log('past the paths');


############################################################################################

LOCATION

############################################################################################

*/

function locationHandler(request, response) {

  // console.log('in location');


  /*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: error because i forgot about making the table on the command line. we are good to go
*/

  let city = request.query.city;
  let sql = 'SELECT * FROM saved_queries;';
  let cachedCityData;
  client.query(sql)
    .then(resultFromPostgres => {
      resultFromPostgres.rows.forEach(value => {
        if (value.search_query.toLowerCase() === city.toLowerCase()) {
          cachedCityData = value;
        }
      });
      if (cachedCityData) {
        response.status(200).send(cachedCityData);
      } else {
        let url = 'https://us1.locationiq.com/v1/search.php';
        let queryParams = {
          key: GEO_DATA_API_KEY,
          q: city,
          format: 'json',
          limit: 1
        };
        superagent.get(url)
          .query(queryParams)
          .then(locationResult => {
            console.log('result is: ', locationResult.body);
            let geoData = locationResult.body;
            const cityData = new Location(city, geoData[0]);
            let sql = 'INSERT INTO past_queries (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            let safeValues = [cityData.search_query, cityData.formatted_query, cityData.latitude, cityData.longitude];
            client.query(sql, safeValues)
              .then(resultsFromPostgres => {
                console.log(resultsFromPostgres);
              });
            response.status(200).send(cityData);
          }).catch((error) => {
            console.log('ERROR', error);
            response.status(500).send('Sorry! Please try again!');
          });
      }
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Sorry! Please try again!');
    });
}

/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: location is taken care off

  ############################################################################################

Weather

############################################################################################

*/

function weatherHandler(request, response) {
  let fullCity = request.query.formatted_query;
  let fullCityArr = fullCity.split(', ');
  let url = 'https://api.weatherbit.io/v2.0/forecast/daily';

  let queryParams = {
    city: fullCityArr[0],
    state: fullCityArr[2],
    country: fullCityArr[3],
    key: WEATHER_API_KEY,
    days: 8
  };

  superagent.get(url)
    .query(queryParams)
    .then(weatherResult => {
      const weatherArray = weatherResult.body.data.map(value => {
        return new Weather(value);
      });
      response.send(weatherArray);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Sorry! Please try again!');
    });

}

/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: weather is done, on to trails

############################################################################################

TRAILS


############################################################################################

*/

function trailsHandler(request, response) {
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  let url = 'https://www.hikingproject.com/data/get-trails';
  let queryParams = {
    key: HIKE_API_KEY,
    lat: latitude,
    lon: longitude
  };

  superagent.get(url)
    .query(queryParams)
    .then(trailsResult => {
      const allTrails = trailsResult.body.trails.map(value => {
        return new Trail(value);
      });
      response.send(allTrails);
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Sorry! Please try again!');
    });
}


/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: weather is done, on to trails

############################################################################################

MOVIES

TMDB API KEY ce5647b488052f5943bd02072b1896dc

https://api.themoviedb.org/3/movie/550?api_key=ce5647b488052f5943bd02072b1896dc

############################################################################################
https://image.tmdb.org/t/p/w500
*/

function movieHandler(request, response) {

  let city = request.query.search_query;
  let url = 'https://api.themoviedb.org/3/search/movie';
  let queryParams = {
    api_key: MOVIE_API_KEY,
    query: city,
    page: 1
  };

  superagent.get(url)
    .query(queryParams)
    .then(movieResult => {
      const allMovies = movieResult.body.results.map(value => {
        return new Movie(value);
      });
      response.send(allMovies) 
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Sorry! Please try again! Movies.');
    });
}



/*
     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: lets group our constructors


############################################################################################

CONSTRUCTORS

############################################################################################

*/

function Location(query, obj) {
  this.search_query = query;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(obj) {
  this.forecast = obj.weather.description;
  this.time = new Date(obj.valid_date).toDateString();
}

function Trail(obj) {
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionStatus;
  let conditionDateTime = obj.conditionDate.split(' ');
  this.condition_date = conditionDateTime[0]; 
  this.condition_time = conditionDateTime[1];
}

function Movie(obj) {
  // console.log('This is the obj title in constructor movies', obj.title);
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}

/*

  let title = request.query.title;
  let overview = request.query.overview;
  let average_votes = request.query.average_votes;
  let total_votes = request.query.total_votes;
  let image_url = request.query.image_url;
  let popularity = request.query.popularity;
  let released = request.query.released_on;

     __
 ___( o)>
 \ <_. )
  `---'   hjw <Rubber duck says: lets group our constructors


############################################################################################

OPEN UP THIS LISTENER

############################################################################################

*/

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on port ${PORT}`));

  }).catch(err => console.log('ERROR', err));


/*
################### Welcome to the #################################
                      .-.
         heehee      /aa \_
                   __\-  / )                 .-.
         .-.      (__/    /        haha    _/oo \
       _/ ..\       /     \               ( \v  /__
      ( \  u/__    /       \__             \/   ___)
       \    \__)   \_.-._._   )  .-.       /     \
       /     \             `-`  / ee\_    /       \_
    __/       \               __\  o/ )   \_.-.__   )
   (   _._.-._/     hoho     (___   \/           '-'
jgs '-'                        /     \
                             _/       \    teehee
                            (   __.-._/

############################ DEAD ZONE ############################
*/


// app.get('/location', (request, response) => {

//   try{
//     let city = request.query.city;
//     let geoData = require('./data/location.json');

//     const obj = new Location(city, geoData);
//     // Art by Hayley Jane Wakenshaw

//     //     __
//     // ___( o)>   <Rubber duck says: request code 200: ok.
//     // \ <_. )
//     //  `---'   hjw
//     response.status(200).send(obj);
//   } catch(error){
//     console.log('ERROR', error);
//     // Art by Hayley Jane Wakenshaw

//     //     __
//     // ___( o)>   <Rubber duck says: error code 500- server side.
//     // \ <_. )
//     //  `---'   hjw
//     response.status(500).send('Sorry, something went wrong with your city');

//     // Art by Hayley Jane Wakenshaw

//     //     __
//     // ___( o)>   <Rubber duck says: We wont get this is the location is outside the scope of the json data
//     // \ <_. )
//     //  `---'   hjw

//   }
// });

// function Location(city, geoData){

//   this.search_query = city;
//   this.formatted_query = geoData[0].display_name;
//   this.latitude = geoData[0].lat;
//   this.longitude = geoData[0].lon;
// }

// //     __
// // ___( o)>   <Rubber duck says: This is for the weather, and its associated by the city data: no data
// // \ <_. )    in JSON nothing to display and an error.
// //  `---'   hjw

// app.get('/weather', (request, response) => {

//   let weatherData = require('./data/weather.json');
//   let info = [];

//   weatherData['data'].forEach(date => {
//     info.push(new Weather(date));
//   });
//   // 200  = ok
//   response.status(200).send(info);

// });

// function Weather(obj) {
//   this.forecast = obj.weather.description;
//   this.time = obj.datetime;
// }

// //==============================Errors=================================

// app.get('*', (request, response) => {
//   response.status(500).send('Sorry, we have an internal server error');
//   //     __
// // ___( o)>   <Rubber duck says: This wont work on firefox, and thus it might be working and not show up
// // \ <_. )     unless we use google chrome as a browser
// //  `---'   hjw
// });

// // ====================================================================
// // Turn on Server and Confirm Port

// app.listen(PORT, () => {
//   console.log(`listening on ${PORT}`);
// });
// //     __
// // ___( o)>   <Rubber duck says: this sets up the listener on the port AND we can see it in the terminal real time.
// // \ <_. )
// //  `---'   hjw
