const mongoose = require('mongoose')
const { MONGO_DB_NAME,MONGO_LOCAL_CONN_URL } = require('../config');
mongoose.connect(`${MONGO_LOCAL_CONN_URL}`, {
    useNewUrlParser: true,
    useCreateIndex: true,

})