/**
 * Created by JoshuaBrummet on 3/26/17.
 */
'use strict';

var _ = require('lodash');
var usergrid = require('usergrid');
var apigee = require('apigee-access');
var async = require('async');
var request = require('request');
var UsergridClient = require('../../node_modules/usergrid/lib/client');
var Usergrid = new UsergridClient({
    "appId": "sandbox",
    "orgId": "brummetj",
    "authMode": "NONE",
    "baseUrl": "https://apibaas-trial.apigee.net",
    "URI": "https://apibaas-trial.apigee.net",
    "clientId": "b3U6YApQFgU6EeeEdxIuBzeXfQ",
    "clientSecret": "b3U6jlcYT4R848HaUp1gnVD1-LSF1CY"
});

module.exports = {

    index: index,
    create: create,
    show: show,
    update: update,
    destroy: destroy,
    createReview: createReview,
    getMovieReview: getMovieReview,
    getReviews: getReviews

};

function index (req,res){

    Usergrid.GET('movies', function(err, response, movie) {

        if(err){
            res.json({error: err});
        }
        else {
            console.log(response.entities);
            res.json({
                movies: response.entities
            }).end();
        }
    })
}
function create (req,res){

    var movies = req.swagger.params.movie.value.movie;
    _.assign(movies, {type: 'movie', name: movies.title});

    if(_.isUndefined(movies.actors) || _.isUndefined(movies.title) || _.isUndefined(movies.year)
    || _.isUndefined(movies.genre)) {

        res.json({
            Error: "Movies values undefined. Are you missing actors, title, year, or genre?"
        });
    }
    else
    Usergrid.POST(movies, function (err, response, movie) {
        if (err) {
            res.json({message: err});
        }
        else {
            movie.save(Usergrid, function (err) {

                if (err) {
                    res.status(500).json(err).end();
                }
                else res.json({
                    message: 'movie created',
                    movie: response
                }).end();
            });
        }
    })
}
function show(req,res){

    //---Updated For Movie Review--

    var uuid = req.swagger.params.movieId.value;
    var review = req.swagger.params.review.value;

    async.waterfall([
        function(callback){
            console.log(uuid);
            Usergrid.GET('movies',uuid, function(error, usergridResponse) {
                // if successful, entity will now be deleted
                if (error) {
                    res.json({error: error});
                }
                else
                    callback(null, usergridResponse);
            });
        },
        function(usergridResponse, callback){
            //Querying for reviews.
            if(review == true) {
                var url = 'https://apibaas-trial.apigee.net/brummetj/sandbox/movies/' + uuid + '/review/';
                console.log('Executing request: ' + url);
                request.get(url, function (err, res) {
                    var response = JSON.parse(res.body);
                    return callback(null, response, usergridResponse);
                });
            }
            else callback(null, null, usergridResponse);
        }
    ], function(error, result, usergridResponse){
        if(_.isNull(result)){
            res.json({movie: usergridResponse.entities})
        }
        else
            res.json({movie: usergridResponse.entities, reviews: result.entities});
    })
}

function update(req,res){

    var uuid = req.swagger.params.movieId.value;

    Usergrid.GET('movies', uuid, function(error, usergridResponse, movie) {
        // if successful, assign movie with new values.
        _.assign(movie, req.swagger.params.movie.value.movie);
        _.assign(movie, {type: 'movie'}); //Post requires a "type":

        Usergrid.PUT(movie, {uuid : uuid}, function (err, usergridResponse) {
            if(err){
                res.json({
                    error: err
                });
            }
            else {
                res.json({
                    message: 'movie updated',
                    movie: usergridResponse
                })
            }
        });

    })
}
function destroy(req,res){

    var uuid = req.swagger.params.movieId.value;
    Usergrid.DELETE('movies',uuid, function(error, usergridResponse) {
        // if successful, entity will now be deleted
        if (error) {
            res.json({error: error});
        }
        else res.json({
            message: 'movie deleted',
            movie: usergridResponse
        }).end();
    })
}

function createReview(req,res){

    async.waterfall([
        function(callback){
            var review = req.swagger.params.review.value.review;
            _.assign(review, {type: 'review'});
            Usergrid.POST(review, function (err, response, review) {
                if (err) {
                    res.json({message: err});
                }
                else {
                    review.save(Usergrid, function (err) {
                        if (err) {
                            res.status(500).json(err).end();
                        }
                        else
                            callback(null, review);
                    });
                }
            });
        },
        function(review, callback){
            //get uuid for a movie
            var uuid = req.swagger.params.movieId.value;
            // url is the request parameter that makes a connection between Usergrid entities
            var url = 'https://apibaas-trial.apigee.net/brummetj/sandbox/movies/' + uuid + '/review/' + review.uuid;
            //POST request to url
            console.log('Executing request: ' + url);
                request.post(url, function(err,res) {
                    callback(null, res);
                });
        }
    ], function(err, result){
        console.log(result.body);
        var response = JSON.parse(result.body);
        res.json({message: response})
    });
}

function getMovieReview(req,res){

    var uuid = req.swagger.params.movieId.value;

    var url = 'https://apibaas-trial.apigee.net/brummetj/sandbox/movies/' + uuid + '/review/';
    console.log('Executing request: ' + url);
    request.get(url, function(err, response){
        var responses = JSON.parse(response.body);
        res.json({
            movie_reviews: responses
        });
    });
}

function getReviews(req,res){

    Usergrid.GET('reviews', function(err, response, reviews) {

        if(err){
            res.json({error: err});
        }
        else {
            console.log(response.entities);
            res.json({
                reviews: response.entities
            }).end();
        }
    })

}