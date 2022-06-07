const mongoose=require('mongoose');
require('../models/User');
//TODO add validation

const dbName='cardGame';
const connectionString=`mongodb://localhost:27017/${dbName}`;
module.exports=async(app)=>{
    try{
    await mongoose.connect(connectionString,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    console.log('Database connected');
    mongoose.connection.on('error',(err)=>{
        console.log('Database error');
        console.log(err);
    })
}
catch(err){
    console.error('Error connection to database');
    process.exit(1);
}
};