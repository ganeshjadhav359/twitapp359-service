const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    twitterProvider: {
        type: {
          id: String,
          token: String
        },
        select: false
    },
   
})


userSchema.statics.upsertTwitterUser = async (token, tokenSecret , profile) => {
    try {
        const user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            const newUser = new User({
              email: profile.emails[0].value,
              // twitterProvider: {
              //   id: profile.id,
              //   token: token,
              //   tokenSecret: tokenSecret
              // }
            });
           const createdUser = await newUser.save();
            return createdUser;
          } 
        else {
            return user;
          }
    }
    catch(err){
        throw new Error(err);
    }   
}


const User = mongoose.model('User', userSchema)

module.exports = User