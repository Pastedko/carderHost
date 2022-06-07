const express = require('express');
const cors=require('cors')
const databaseConfig = require('./config/database');
const epxressConfig=require('./config/express');
const routesConfig=require('./config/routes')
const {Server, Socket}=require("socket.io");
const http=require('http')
const app=express();
const server=http.createServer(app)
const {socketConnection}=require('./socket/socket');
socketConnection(server);


start();

async function start(){
    app.use(cors());
    app.use(express.json())
    epxressConfig(app);
    await databaseConfig();
    routesConfig(app)

    app.get('/',(req,res)=>{
        console.log(req.session);
        res.render('home',{layout:false})

    })
    server.listen(3000,()=>console.log('Server running on port 3000.'))
}
module.exports={app}