const rp = require('request-promise');
const { consumerKey, consumerSecret } = require('../config');


const getAccessToken = async (req,res,next) => {
    try{

        // console.log(req);
        const options ={
            url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
            oauth: {
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                token: req.query.oauth_token
            },
            form: { oauth_verifier: req.query.oauth_verifier}
        }
        const response = await rp.post(options);
        // console.log(response);
        let jsonBody='';

            // const body = await response.text();
            jsonBody = '{ "' + response.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
            jsonBody = JSON.parse(jsonBody);
            req.body['oauth_token'] = jsonBody.oauth_token;
            req.body['oauth_token_secret'] = jsonBody.oauth_token_secret;
            req.body['user_id'] = jsonBody.user_id;
            next();
    }
    catch(err){
        res.status(400).send(err);
    }
};

module.exports={
    getAccessToken
}