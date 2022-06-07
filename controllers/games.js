const {Router}=require('express');
const { Cookie } = require('express-session');
const { isUser,isGuest } = require('../middleware/guard');
const { register, getUserById } = require('../services/user');
const {login}=require('../services/user');
const mapErrors = require('../util/mappers');
const jwt=require('jsonwebtoken');
const jwt_decode=require("jwt-decode");
const {createLobby,getAllGames,joinGame, findGameById,leaveGame, changeTeam}=require('../services/game');
const { createServer } = require('http');
const router=Router()

router.post('/create',async (req,res)=>{
    try{
    let lobby=await createLobby(req.body);
 
    res.status(200).send(lobby)
    }
    catch(err){
        res.status(403).send(err.message);
    }
})

router.get('/getAll',async (req,res)=>{
    games=await getAllGames();
    if(games)res.status(200).send(games);
})

router.post('/join/:game',async (req,res)=>{
    try{
    let deocded=jwt_decode(req.body._id);
    lobby=await joinGame(deocded.subject,req.params.game);
    res.status(200).send(lobby);
    }
    catch(err){
        res.status(403).send(err.message);
    }
})

router.get('/getGame/:id',async(req,res)=>{
    try{
        lobby=await findGameById(req.params.id);
        res.status(200).send(lobby)
    }
    catch(err){
        res.status(403).send(err.message);
    }
})

router.get('/getUser/:id',async(req,res)=>{
    try{
        let decoded=jwt_decode(req.params.id)
        user=await getUserById(decoded.subject)
        res.status(200).send(user);
    }
    catch(err){
        res.status(404).send(err.message);
    }
})

router.get("/getGuest/:id",async(req,res)=>{
    try{
        guest=jwt_decode(req.params.id);
        res.status(200).send(String(guest.subject));
    }
    catch(err){
        res.status(404).send(err.message);
    }
})

router.post("/leaveGame/:id",async(req,res)=>{
    try{
        let deocded=jwt_decode(req.body._id);
        lobby=await leaveGame(deocded.subject,req.params.id);

        res.status(200).send(lobby);
    }
    catch(err){
        res.status(404).send(err.message)
    }
})

router.post("/change/:id",async(req,res)=>{
    try{
        let decoded=jwt_decode(req.body._id);
        let lobby=await changeTeam(decoded.subject,req.params.id);
        res.status(200).send(lobby)
    }
    catch(err){
        res.status(403).send(err.message);
    }
})

module.exports=router;