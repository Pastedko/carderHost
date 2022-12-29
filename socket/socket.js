
const { dealCards, playCard, changeTurn, gameStart, makeCall, gameEnd,callPremium,findUserInGame, updateCards } = require('../services/cards')
const jwt = require('jsonwebtoken');
const Game = require('../models/Games');
let io;

exports.socketConnection = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: "https://carders.oa.r.appspot.com/",
            methods: ["GET", "POST"],
            allowedHeaders: ["my-custom-header"],
            credentials: true
        }
    })
    io.on('connection', socket => {



        console.log('new connection');
        socket.on('disconnect', () => console.log('disconnected'));


        socket.on("reconnect",async(input)=>{
            let game=input.game;
            let user=input.user
            console.log(typeof findUserInGame)
            if(findUserInGame(user._id,game)){
                console.log(user);
            socket.join(String(game._id));
            }
            console.log("reconnected")
        })

        socket.on("gameLobbyJoin", async (game) => {
            console.log("gameLobbyJoin")
            const lobby = await Game.findById(game);
            io.to(String(game)).emit("gameLobby", lobby);
            socket.join(String(game));
        })
        socket.on("gameLobby", async (game) => {
            console.log("gameLobby")
            io.to(String(game)).emit("gameLobby", game);
        })
        socket.on("gameLobbyLeft", async (game) => {
            socket.leave(String(game));
            const lobby = await Game.findById(game);
            io.to(String(game)).emit("gameLobby", lobby);
        })
        socket.on("gameCreated", async (game) => {
            console.log("gameCreated")
            socket.join(String(game));
            io.emit("homeGames");
        })

        socket.on("gameStarted", async (game) => {
            io.to(String(game._id)).emit("gameStarted");
            let deck = await dealCards(game)
            gameStart(game)
            setTimeout(() => { io.to(String(game._id)).emit("dealCards", deck) }, 2000);
        })

        //actual Game

        //socket.on("dealCards",async())
        socket.on("cardPlayed", async (input) => {
            let card = input.card;
            let game = input.game;
            let hand = input.hand;
            if(socket.rooms.has(String(game._id))){
            let result2 = await playCard(card, hand, game);
            io.to(String(game._id)).emit("cardPlayed", card);
            let result = await changeTurn(game)
            if (result) {
                console.log("handEnded")
                setTimeout(() => { io.to(String(game._id)).emit('handEnded'); }, 1000);
               
            }
            if (result2 == "gameEnded") {
                console.log("gameEnded");
                socket.emit("gameEnded");
                let myGame=await gameEnd(game);
                io.to(String(game._id)).emit("showResult",myGame.result);
                if(myGame.finished==true){
                    setTimeout(() => {  io.to(String(game._id)).emit("gameFinished") }, 4000);
                }
            }
            else if(result2=="belot gameEnded"){
                io.to(String(game._id)).emit("belot",card)
                console.log("belot")
                socket.emit("gameEnded")
                let myGame=await gameEnd(game);
                io.to(String(game._id)).emit("showResult",myGame.result);
                if(myGame.finished==true){
                    setTimeout(() => {  io.to(String(game._id)).emit("gameFinished") }, 5000);
                }
            }
            else if(result2=="belot"){
                io.to(String(game._id)).emit("belot",card)
                console.log("belot")
            }
        }
        })

        socket.on("callMade", async (input) => {
            console.log("callMade")
            let call = input.call;
            let team = input.team
            let game = input.game;
            let player=input.player
            if(socket.rooms.has(String(game._id))){
            let result = await makeCall(call, team, game);
            if (result == "gameStart") {
                io.to(String(game._id)).emit("startGame");
            }
            else if(result=="newCalls"){
                console.log("newCalls")
                socket.emit("gameEnded")
            }
            io.to(String(game._id)).emit("callMade", {call:call,player:player});
        }
        })
        
        socket.on("premiumCalled",async (input)=>{
            let highestCard=input.card;
            let game=input.game;
            let call=input.call;
            if(socket.rooms.has(String(game._id))){
            let result = await callPremium(highestCard,call,game)
            io.to(String(game._id)).emit("premiumCalled",{call:call,player:highestCard.player});
            }
        })
        socket.on("submitCards",async (input)=>{
            let cards=input.cards;
            let player=cards[0].player;
            let game=input.game;
            await updateCards(player,cards,game)
        })

    })
}

exports.sendMessage = (room, key, message) => io.to(room).emit(key, message);