const express = require('express');
const rp = require('request-promise');
const router = new express.Router();
const { getAccessToken } = require('../middleware/getToken');
const { consumerKey, consumerSecret } = require('../config');
const { passportInitialization } =require('../passportTwitter');
const {
    generateAuthToken,
    sendToken
} = require('../middleware/auth');
const passport = require('passport');


passportInitialization();



router.post('/users',async function(req,res){
    try{
        const user =new User(req.body);
        const createdUser =await user.save();
        res.status(201).send(createdUser);
    }
    catch(err){
        res.status(400).send(err);
    }
});

router.post('/users/oauth/request_token',async (req,res) => {
    try{
        const options={
            url: 'https://api.twitter.com/oauth/request_token',
            oauth: {
              oauth_callback: "http://127.0.0.1:3000/",
              consumer_key: consumerKey,
              consumer_secret: consumerSecret
            }
        }
        const  response = await rp.post(options);
        // console.log(response);
        // const body = await response.text();
        // console.log(body);
        const jsonBody = '{ "' + response.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';

        res.status(200).send(JSON.parse(jsonBody));

    }
    catch(err){
        res.status(500).send( { error:`${err}`} );
    }
});
const authenticateUser = (req,res,next) =>{
    if (!req.user) {
        return res.send(401, 'User Not Authenticated');
      }
      req.twitter_user_id=req.body.user_id;
      req.id=req.user._id;
      return next();
}

router.post('/users/oauth/access_token',getAccessToken , passport.authenticate('twitter-token', {session: false}), authenticateUser , generateAuthToken,sendToken);



module.exports=router;