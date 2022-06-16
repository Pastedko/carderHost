const {Router}=require('express');
const { Cookie } = require('express-session');
const { isUser,isGuest } = require('../middleware/guard');
const { register } = require('../services/user');
const {login}=require('../services/user');
const mapErrors = require('../util/mappers');
const jwt=require('jsonwebtoken');

const router=Router();


//TODO check form action,method,field names
router.post('/register',async (req,res)=>{
    try{
    if(req.body.password!=req.body.passwordAgain){
        throw new Error('Passwords don\'t match')
    }
    const user=await register(req.body.email,req.body.password,req.body.username);
    let payload={subject:user._id};
    let token=jwt.sign(payload,'secretKey');
    res.status(200).send({token});
    //res.redirect('/');//TODO check redirect requirements
    }
    catch(err){
        const errors=mapErrors(err);
        console.error(err);
        res.send(err.message)
        //res.render('register',{data:{username:req.body.username},errors})
    }
})



router.post('/login',isGuest(),async (req,res)=>{
    try{
        const user=await login(req.body.email,req.body.password);
        let payload={subject:user._id};
        let token=jwt.sign(payload,'secretKey');
        res.status(200).send({token});
       // req.session.user=user;
       // res.redirect('/');//TODO check redirect requirements
        }
        catch(err){
            res.status(409).send(err.message);
            const errors=mapErrors(err);
            console.error(err);
        }
})

router.get('/logout',isUser(),(req,res)=>{
    delete req.session.user;
    res.redirect('/');
})

//router.get('/special',verifyToken(),(req,res)=>{
    
//})
router.post('/guest',(req,res)=>{
    let payload={subject:Math.floor(Math.random()*1000)}
    let token=jwt.sign(payload,'secretKey');
    res.status(200).send({token})
})

module.exports=router;