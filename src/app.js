const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('./db/mongoose');
const userRouter = require('./routers/user');
const featuresRouter = require('./routers/features');

const cors = require('cors');

const  corsOption = {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['jwt-token']
};

app.use(cors(corsOption));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(userRouter);
app.use(featuresRouter);


// app.get('/',(req,res)=>{
//     console.log('hello world');
//     res.status(200).send({message:'ganesh jadhav'});
// })
app.listen(process.env.PORT || 4000,() =>{
    console.log("server started.....");
});