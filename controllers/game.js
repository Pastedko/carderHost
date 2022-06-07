const {Router}=require('express');
const { Cookie } = require('express-session');
const { isUser,isGuest } = require('../middleware/guard');
const { register, getUserById,saveGameInMatchHistory } = require('../services/user');
const {login}=require('../services/user');
const mapErrors = require('../util/mappers');
const jwt=require('jsonwebtoken');
const jwt_decode=require("jwt-decode");
const {createLobby,getAllGames,joinGame, findGameById,leaveGame, changeTeam}=require('../services/game');
const {dealCards,allowedCards,findCard, checkPremium, gameEnd}=require("../services/cards")
const { createServer } = require('http');
const Game=require('../models/Games')
const router=Router();

router.get("/dealCards/:id",async()=>{
    console.log('hi')
    dealCards();
});

router.post("/allowed",async(req,res)=>{
    
    let hand=req.body.hand;
    let game=req.body.game;
    let card=req.body.card
    let myGame = await Game.findById(game._id);
    if(myGame.playedCards.length!=0){
    let allowed=await allowedCards(hand,game);
    let result=findCard(card,allowed)
    res.status(200).send(result);
    }
    else
    res.status(200).send(true);
})

router.post("/premium",async(req,res)=>{
    let game=req.body.game;
    let highestCard=req.body.card;
    let call=req.body.call;
    let result = await checkPremium(highestCard,call,game);
    res.status(200).send(result)
})

router.post("/gameFinished",async(req,res)=>{
    console.log("hello")
    let game=req.body.game;
    let user=req.body.user;
    await saveGameInMatchHistory(user,game);
    res.status(200);

})


module.exports=router;