const Game = require('../models/Games');

const { register, getUserById } = require('../services/user');
const jwt = require('jsonwebtoken');
const jwt_decode = require("jwt-decode");
const { default: mongoose, Types, ObjectId } = require('mongoose');
const {sendMessage}=require('../socket/socket');


async function createLobby(lobby) {
    let decoded = jwt_decode(lobby.players[0]);
    let player;
    if (typeof decoded.subject == "number") player = decoded.subject;
    else player = await getUserById(decoded.subject)
    const game = new Game({
        name: lobby.name,
        password: lobby.password,
        players: [],
        active: lobby.active
    })
    game.players.push([player,1]);
    let games = await getAllGames();
    games.forEach(el => {
        if (findUserInGame(player, el)) {
            leaveGame(player, el._id)
            sendMessage(String(el._id),"gameLobby",el._id)
        }
    })
    if (games.filter(el => {return el.name == game.name&&el.exists}).length != 0) {
        throw new Error("Game with that name already exists")
    }
    await game.save();
    return game;
}

async function getAllGames() {
    const games = await Game.find({});
    return games;
}

async function joinGame(user, game) {

    const lobby = await findGame(game);

    if (findUserInGame(user, lobby)) {
        throw new Error("User has already joined this game");
    }
    if (lobby.players.length == 4) {
        throw new Error("Game is full")
    }
    let result = user;
    if (typeof user != "number") {
        result = await getUserById(user);
        result.currentGame = mongoose.Types.ObjectId(lobby._id);
        result.markModified("players");
        await result.save();
    }
    
    let games = await getAllGames();
    games.forEach(el => {
        if (findUserInGame(user, el)) {
            leaveGame(user, el._id)
        }
    })
    let team=chooseTeam(lobby);
    lobby.players.push([result,team]);
    lobby.markModified("players");
    await lobby.save();
    return lobby;
}
function chooseTeam(lobby){

    let team1Count=0;
    let team2Count=0;
    lobby.players.forEach(el=> {
        if(el[1]==1){
            team1Count++;
        }
        else {
            team2Count++;
        }
    });
    if(team1Count<2)return 1;
    else return 2;
}
async function findGame(name) {
    const game = await Game.findOne({ name: name })
    return game
}
async function findGameById(id) {
    const game = await Game.findById(id);
    return game;
}
function findUserInGame(user, game) {
    
    if (typeof user == "number") {
        if (game.players.filter(el=>el[0]==user).length> 0) return true;
        else return false;
    }
    else {
       // console.log(game)
        let flag=false;
        game.players.forEach(el=>{
            if(String(el[0]._id)==String(user))flag=true;
        })
      //  console.log(flag)
        //console.log(game)
        if (flag)return true;
        else { return false; }
    }


}

async function leaveGame(user, game) {
    let lobby = await findGameById(game);
    //if (!findUserInGame(user, lobby)) {
    //    throw new Error("User is not in this game");
    // }
    
    if (lobby.players.length == 1) {
        lobby.exists=false;
        lobby.markModified("exists")
        await lobby.save();
    }
    else {
        let result = user;
        if (typeof user != "number") {
            result = await getUserById(user);
            lobby.players.forEach((el, index) => {
                if (String(el[0]._id) == String(result._id)) {  lobby.players.splice(index, 1); }
            });
        }
        else {
            let i
            for( i=0;i<lobby.players.length;i++){
                if(lobby.players[i][0]==result)break;
            }
            lobby.players.splice(i,1);
        }
        sendMessage(String(lobby._id),"gameLobby",lobby._id)
        lobby.markModified("players");
        await lobby.save();
        return lobby;
    }
}

async function changeTeam(user,game){
    let lobby = await findGameById(game);
    if (typeof user != "number") {
        result = await getUserById(user);
        lobby.players.forEach((el, index) => {
            if (String(el[0]._id) == String(result._id)) {  lobby.players[index][1]=3-lobby.players[index][1]; }
        });
    }
    else {
        let i
        for( i=0;i<lobby.players.length;i++){
            if(lobby.players[i][0]==user)break;
        }
        lobby.players[i][1]=3-lobby.players[i][1];
    }
    lobby.markModified("players")
    await lobby.save();
    return lobby;
}



module.exports = {
    createLobby,
    getAllGames,
    joinGame,
    findGame,
    findUserInGame,
    findGameById,
    leaveGame,
    changeTeam,
}