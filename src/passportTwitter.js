const passport = require('passport');
const TwitterTokenStrategy = require('passport-twitter-token');
const User = require('./models/user');
const { consumerKey, consumerSecret } = require('./config');

const passportInitialization = () => {

    passport.use(new TwitterTokenStrategy({
        consumerKey: consumerKey,
        consumerSecret: consumerSecret,
        includeEmail: true
      },
         async (token, tokenSecret, profile, done) => {
         try{
            const user = await User.upsertTwitterUser(token, tokenSecret, profile);
            done(null,user);
         }
         catch(err){
             done(err,null);
         }   
      }));
  
}

module.exports={
    passportInitialization
}