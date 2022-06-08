const jwt=require('jsonwebtoken');
function isUser()
{
    return function(req,res,next){
        if(req.session.user){
            next();
        }else{
            res.redirect('/login');
        }
    }
}


function isGuest()
{
    return function(req,res,next){
        if(req.session.user){
            res.redirect('/');
        }else{
            next();
        }
    }
}
function verifyToken(){
    return function(req,res,next){
        if(!req.headers.authorization){
            return res.status(401).send('Unauthorized request')
        }
        let token=req.headers.authorization.split(' ')[1];
        if(token==='null'){
            return res.status(401).send('Unauthorized request')
        }
        let payload=jwt.verify(token,'secretKey')
        if(!payload){
            return res.status(401).send('Unauthorized request')
        }
        req.userId=paylo.subject;
        next()
    }
    
}
module.exports={
    isGuest,
    isUser,
    verifyToken
};