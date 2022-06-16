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

function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}
async function start(){
    app.use(cors());
    app.use(express.json())
    app.use(requireHTTPS);
    app.use(express.static('./dist/website'));
    epxressConfig(app);
    await databaseConfig();
    routesConfig(app)

    app.get('/*', function(req, res) {
        res.sendFile('index.html', {root: 'dist/website/'}
      );
      });
    server.listen(process.env.PORT||3000,()=>console.log('Server running on port 3000.'))
}
module.exports={app}