const jwt = require('jsonwebtoken');
const { JWT_SECRET} = require('../config');

const authenticateToken = async (req, res, next) => {
    let token = req.header('jwt-token');
    if(token){
        try {
                token = req.header('jwt-token').replace('Bearer ', '');
                const decoded = jwt.verify(token, JWT_SECRET,{ expiresIn: '20 days' });


                if (!decoded) {
                    throw new Error();
                }
                req.payload = decoded;
                next()
        } catch (err) {
            res.status(401).send({ error: 'Please authenticate.' });
        }
    }
    else{

        const result = { 
            error: `Authentication error. Token required.`,
            status: 401
          };
        res.status(401).send(result);
    }
}
const generateAuthToken =  async function (req,res,next) {
    
     req.token = jwt.sign({ id: req.id,twitter_user_id : req.twitter_user_id ,oauth_token :req.body.oauth_token, oauth_token_secret : req.body.oauth_token_secret}, JWT_SECRET,{ expiresIn: '20 days' });
    next();
}

const sendToken = function (req, res) {
    res.setHeader('jwt-token',req.token);
    return res.status(200).send({email:`${req.user.email}`});
  };
module.exports = {
    authenticateToken,
    generateAuthToken,
    sendToken
};