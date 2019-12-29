const express = require('express');
const rp = require('request-promise');
const router = new express.Router();
const { consumerKey, consumerSecret,MONGO_LOCAL_CONN_URL,MONGO_DB_NAME } = require('../config');
const {
    authenticateToken,
} = require('../middleware/auth');
const MongoClient = require('mongodb').MongoClient;
const moment = require('moment');

router.get('/get/tweets',authenticateToken,async (req,res)=>{
    try{
        let chunkOfTweets=[]; 
        oauth ={
                consumer_key: consumerKey ,
                token:req.payload.oauth_token,
                token_secret : req.payload.oauth_token_secret,
                consumer_secret : consumerSecret
            }
            // console.log(oauth);
            let lastUserId=undefined;
            let tillDate=moment().subtract(7, 'days').format('YYYY-MM-DD');
            let count =0;
            while(1){

                    if(count===4)
                        break;
                    count++;
                    let data;
                    if(!lastUserId){

                        const options={
                            url: 'https://api.twitter.com/1.1/statuses/home_timeline.json',
                            oauth : oauth,
                            qs: {
                                count : 100
                            },
                            json:true
                        }
                        data = await rp.get(options);
                        chunkOfTweets = chunkOfTweets.concat(data);
                    }

                    else{

                        const options={
                            url: 'https://api.twitter.com/1.1/statuses/home_timeline.json',
                            oauth : oauth,
                            qs: {
                                count : 100,
                                max_id : lastUserId
                            },
                            json:true
                        }

                        data = await rp.get(options);
                        chunkOfTweets = chunkOfTweets.concat(data);
                    }
                
                    if(data.length===0){
                        // console.log(count);
                        break;
                    }
                    else{

                        lastUserId = data[data.length-1].id_str;
                        const lastRecordDate = moment(new Date(data[data.length-1].created_at)).format('YYYY-MM-DD');
                        if(lastRecordDate < tillDate)
                            break; 
                    }
                    // console.log(data.length);     
            }

            for(let i=0;i<chunkOfTweets.length;i++){
                chunkOfTweets[i].twitter_user_id=req.payload.id;
            }

        const client = await MongoClient.connect(MONGO_LOCAL_CONN_URL,{useNewUrlParser: true});
        const db = await client.db(MONGO_DB_NAME);
        const data = await db.collection('tweets').deleteMany({twitter_user_id:req.payload.id});
        const reponse = await db.collection('tweets').insertMany(chunkOfTweets);
        res.status(200).send({data:chunkOfTweets.length});
       
    }
    catch(err){
        res.status(501).send({err:`${err}`});
    }
})

router.get('/homepage/tweets',authenticateToken,async (req,res)=>{

    try {

        const client = await MongoClient.connect(MONGO_LOCAL_CONN_URL,{useNewUrlParser: true});
        const db = await client.db(MONGO_DB_NAME);
        const data = await db.collection('tweets').find({twitter_user_id:req.payload.id}).limit(400).toArray();
        const hashtagMap = new Map();
        const userMap = new Map();
        let tweets = [];

        for(const tweet of data ){
            const newTweet ={
                created_at:moment(new Date(tweet.created_at)).format('MMM Do YY'),
                text:tweet.text,
                tweetUrl: tweet.entities.urls.length!=0 ? tweet.entities.urls[0].url : 'NA',
                name:tweet.user.name ,
                screen_name : tweet.user.screen_name, 
                profile_img: tweet.user.profile_banner_url
            }
            tweets.push(newTweet);
            
            if(userMap.has(tweet.user.id_str))
            {
                const user =userMap.get(tweet.user.id_str);
                user.count = user.count+1;
                userMap.set(tweet.user.id_str,user);
            }
            else{
                const user={
                    username:tweet.user.name,
                    count:1
                }
                userMap.set(tweet.user.id_str,user);
            }
            for(const hashtag of tweet.entities.hashtags){
                if(hashtagMap.get(hashtag.text)){
                    let count = hashtagMap.get(hashtag.text) + 1;
                    hashtagMap.set(hashtag.text,count);
                }
                else    
                    hashtagMap.set(hashtag.text,1);
            }
        }
        let links =undefined;
        let numberOfLinks =undefined;
        const sortedUser  = [...userMap.keys()].sort((a,b) => (userMap.get(a).count > userMap.get(b).count ? -1 : 1));
        const sotredHashtag = [...hashtagMap.keys()].sort((a,b) => (hashtagMap.get(a).count > hashtagMap.get(b).count ? -1 : 1));
        const topHashtags =[];
        if(sortedUser.length!=0){
            links=userMap.get(sortedUser[0]).username;
            numberOfLinks = userMap.get(sortedUser[0]).count;
        }
        for(let i=0 ;i < sotredHashtag.length && i < 5;i++)
            topHashtags.push(sotredHashtag[i]);
        

        const responseData={
            tweets : tweets,
            most_links : links,
            link_count : numberOfLinks,
           hashtags : topHashtags
        }
        res.status(200).send(responseData);

    } catch (error) {
        res.status(501).send(error);
    }
    
})

router.post('/search/hashtag',authenticateToken,async (req,res)=>{
    
    try {
        const oauth ={
            consumer_key: consumerKey ,
            token:req.payload.oauth_token,
            token_secret : req.payload.oauth_token_secret,
            consumer_secret : consumerSecret
        }
        const options={
                url: 'https://api.twitter.com/1.1/search/tweets.json',
                oauth : oauth,
                qs: {
                    q : req.body.search,
                    include_entities: true,
                    count : 50,
                },
                json:true
            }
        
        const responseData  = await rp.get(options);

        const tweets=[];

        if(responseData.statuses){
            for(const tweet of responseData.statuses ){
                const newTweet ={
                    created_at:moment(new Date(tweet.created_at)).format('MMM Do YY'),
                    text:tweet.text,
                    tweetUrl: tweet.entities.urls.length!=0 ? tweet.entities.urls[0].url : 'NA',
                    name:tweet.user.name ,
                    screen_name : tweet.user.screen_name, 
                    profile_img: tweet.user.profile_banner_url
                }
                tweets.push(newTweet);
            }
        }
        const data={
            tweets:tweets
        }
        res.status(200).send(data);
            
    } catch (error) {
        res.status(501).send(error);
    }
  
    
})

router.post('/search/location',authenticateToken,async (req,res)=>{
    
    try {
        const oauth ={
            consumer_key: consumerKey ,
            token:req.payload.oauth_token,
            token_secret : req.payload.oauth_token_secret,
            consumer_secret : consumerSecret
        }
        const options={
                url: 'https://api.twitter.com/1.1/search/tweets.json',
                oauth : oauth,
                qs: {
                    geocode : req.body.city,
                    count : 50
                },
                json:true
            }
        
        const responseData  = await rp.get(options);

        const tweets=[];

        if(responseData.statuses){
            for(const tweet of responseData.statuses ){
                const newTweet ={
                    created_at:moment(new Date(tweet.created_at)).format('MMM Do YY'),
                    text:tweet.text,
                    tweetUrl: tweet.entities.urls.length!=0 ? tweet.entities.urls[0].url : 'NA',
                    name:tweet.user.name ,
                    screen_name : tweet.user.screen_name, 
                    profile_img: tweet.user.profile_banner_url
                }
                tweets.push(newTweet);
            }
        }
        const data={
            tweets:tweets
        }
        res.status(200).send(data);
            
    } catch (error) {
        res.status(501).send(error);
    }
  
    
})


module.exports=router;