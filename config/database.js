const mongoose=require('mongoose');
require('../models/User');
//TODO add validation

const dbName='cardGame';
const connectionString=`mongodb+srv://tedox:<summer274371>@carder.jmfmx.mongodb.net/?retryWrites=true&w=majority`;
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