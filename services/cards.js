const Game = require('../models/Games');
const { Router } = require('express');
const { Cookie } = require('express-session');
const { isUser, isGuest } = require('../middleware/guard');
const { register, getUserById } = require('../services/user');
const { login } = require('../services/user');
const mapErrors = require('../util/mappers');
const jwt = require('jsonwebtoken');
const jwt_decode = require("jwt-decode");
const { default: mongoose, Types, ObjectId } = require('mongoose');
const socket  = require('../socket/socket');
const e = require('express');
const res = require('express/lib/response');
const { update } = require('../models/Games');

let faces = ["7", "8", "9", "J", "Q", "K","10", "A"];
let facePowers = [1,3, 5, 7, 9, 11, 13, 15];
let points=[0,0,0,2,3,4,10,11];
let cardOrder=[0,1,2,4,5,6,3,7];
let suits = ["♠", "♣", "♥", "♦"];
let names = ["spades", "clubs", "hearts", "diams"];
let suitPowers = [1, 1, 1, 1];
let defaultSuitPower=[3,0,2,1];

class Card {
    face;
    suit;
    player;
    name;
    facePower;
    suitPower;
    points;
    team;
    cardOrder;
    belot;
    defaultSuitPower;
    constructor(face, suit, player, name, facePower, suitPower, points,team,cardOrder,defaultSuitPower) {
        this.face = face;
        this.suit = suit;
        this.player = player;
        this.name = name;
        this.facePower = facePower;
        this.suitPower = suitPower;
        this.points=points;
        this.team=team;
        this.cardOrder=cardOrder
        this.belot=false;
        this.defaultSuitPower=defaultSuitPower;
    }

}

async function gameStart(game) {
    let myGame = await Game.findById(game._id);
    myGame.handScore=[0,0];
    myGame.contract=-1;
    myGame.teamCalled=0;
    console.log(1)
    if(myGame.score[0]==0&&myGame.score[1]==0&&myGame.passCount==0){
        myGame.active=true;
    myGame.players[0].push(true);
    for (let i = 1; i < myGame.players.length; i++) {
        myGame.players[i].push(false);
    }
    myGame.players.sort((a, b) => {
        return a[1] - b[1];
    })
    myGame.startingPlayer=myGame.players[0];
    myGame.lastStarted=0;
}
else{
    myGame.passCount=0;
    let filter={_id:game._id}
    let updates={passCount:myGame.passCount}
   await Game.findOneAndUpdate(filter,updates);
    switch(myGame.lastStarted){
        case 0:{myGame.startingPlayer = myGame.players[2];break}
        case 1:{myGame.startingPlayer = myGame.players[3];break}
        case 2:{myGame.startingPlayer = myGame.players[1];break}
        case 3:{myGame.startingPlayer = myGame.players[0];break}
    }
    for(let i=0;i<myGame.players.length;i++){
        if(JSON.stringify(myGame.players[i][0])==JSON.stringify(myGame.startingPlayer[0])){
            myGame.players[i][2]=true;
            myGame.lastStarted=i;
        }
        else {
            myGame.players[i][2]=false;
        }
    }
}
    let filter={_id:myGame._id}
    let updates={players:myGame.players,startingPlayer:myGame.startingPlayer,lastStarted:myGame.lastStarted,handScore:[0,0],contract:-1,teamCalled:0,active:myGame.active}
    await Game.findByIdAndUpdate(filter,updates);
}
async function dealCards(game) {
    let myGame = await Game.findById(game._id);
    let deck = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 8; j++) {
            card = new Card(faces[j], suits[i], "", names[i], facePowers[j], suitPowers[i],points[j],0,cardOrder[j],defaultSuitPower[i]);
            deck.push(card);
        }
    }
   //let shuffled=deck
    let shuffled = shuffle(deck);
    shuffled = shuffle(shuffled);
    shuffled = shuffle(shuffled);
    shuffled = shuffle(shuffled);
    
    myGame.deck=shuffled;
   // myGame.markModified("deck");
   // myGame.save();
    return shuffled;

}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

async function playCard(card,hand, game) {
    let myGame = await Game.findById(game._id);
    let currentHand=myGame.playedCards;
    myGame.playedCards.push(card);
    // console.log(myGame.playedCards)
    
    myGame.markModified("playedCards")
    await myGame.save()
    if(currentHand.length==4&&hand.length==1){
        if(card.belot==true){
            callBelot(card.team,game);
            return "belot gameEnded"
        }
        return "gameEnded"
    }
    if(card.belot==true){
        
        callBelot(card.team,game);
        return "belot"
    }
    return 1
}
async function callBelot(team,game){
    let myGame = await Game.findById(game._id);
    myGame.premiums[team].push([-1]);
    let filter={_id:myGame._id}
    let updates={premiums:myGame.premiums}
    myGame.markModified("premiums");
    await myGame.save();
    //await Game.findOneAndUpdate(filter,updates)
}
function findCard(card,hand){
    let result=false;
    hand.forEach(el=>{

        if(JSON.stringify(el)==JSON.stringify(card)){
            result=true;}
    })
    return result;
}
async function setFirstPlayer(player,game){
    let myGame = await Game.findById(game._id);
    myGame.startingPlayer=player;
    let filter={_id:game._id}
    let update={startingPlayer:player}
    await Game.findOneAndUpdate(filter,update)
  //  myGame.markModified("startingPlayer");
   // myGame.save()
}

async function getPlayerIndex(player,game){
    let myGame = await Game.findById(game._id);
    for(let i=0;i<myGame.players.length;i++){
        if(JSON.stringify(myGame.players[i][0])==JSON.stringify(player[0])){
            return i;
        }
    }
    return "notFound"
}
async function changeTurn(game) {
    let myGame = await Game.findById(game._id);
    if(myGame.playedCards.length!=4){
    let currentTurn;
    let currentTurnIndex;
    for (let i = 0; i < myGame.players.length; i++) {
        if (myGame.players[i][2] == true) {
            currentTurn = myGame.players[i];
            currentTurnIndex = i;
            break;
        }
    }
    
    let currentTeamTurn = currentTurn[1];
    myGame.players[myGame.players.indexOf(currentTurn)][2] = false;
    //change indexes!
    if (currentTeamTurn == 1) {
        myGame.players[currentTurnIndex + 2][2] = true;
        myGame.markModified("players")

        myGame.save()
        return false;
    }
    else {
        if (currentTurnIndex == 3) {
            myGame.markModified("players")
            myGame.save()
            myGame.players[0][2] = true;

            return false;
        }
        else {
            myGame.markModified("players")
            myGame.save()

            myGame.players[currentTurnIndex - 1][2] = true;

            return false;
        }
    }
}
else{
    let winningCard=await handWinner(game);
    await setFirstPlayer([winningCard.player],game);
    await calculateHand(winningCard,game);
    myGame.lastHandWinner=winningCard.team;
    myGame.playedCards=[];
   let filter={_id:myGame._id}
   let updates={playedCards:myGame.playedCards,lastHandWinner:myGame.lastHandWinner}
    await Game.findOneAndUpdate(filter,updates);
    setTimeout(async () => { await beginHand(game);}, 10);
    return true;
}
}

//TODO
async function calculateHand(card,game){
    let myGame=await Game.findById(game._id);
    let teamWinner=card.team;
    let hand=myGame.playedCards;
    let points=0;
    hand.forEach(el=>{
        points+=el.points;
    })
    myGame.handScore[teamWinner-1]+=points;
    let update={handScore:[myGame.handScore[0],myGame.handScore[1]]}
    let filter={_id:game._id}
    await Game.findOneAndUpdate(filter,update);
}
//!!!!!!!!!!!!!!!!!!!

async function beginHand(game){
    let myGame=await Game.findById(game._id);
    let firstPlayer=myGame.startingPlayer;
    for(let i=0;i<myGame.players.length;i++){
        if(JSON.stringify(myGame.players[i][0])==JSON.stringify(firstPlayer[0])){
            myGame.players[i][2]=true;
        }
        else
        myGame.players[i][2]=false;
    }
    myGame.markModified("players");
    
    myGame.save()
}

async function updateCards(player,cards,game){
    let myGame = await Game.findById(game._id);
    let index=-1;
    myGame.players.forEach((el,i)=>{

        if(el[0]==player||JSON.stringify(el[0])==JSON.stringify(player))index=i;
    })
    if(index!=-1){
        myGame.cards[index]=cards;
        let filter={_id:myGame._id};
        let updates={cards:myGame.cards}
        await Game.findOneAndUpdate(filter,updates);
    }
}

async function makeCall(call,team, game) {
    let myGame = await Game.findById(game._id);
    if (call != 7) {
        myGame.teamCalled=team;
        myGame.contract = call;
        myGame.passCount = 0;
        let filter={_id:game._id}
        let updates={passCount:myGame.passCount,contract:myGame.contract,teamCalled:myGame.teamCalled}
        await Game.findOneAndUpdate(filter,updates);
    }
    else {
        myGame.passCount++;
        let filter={_id:game._id}
        let updates={passCount:myGame.passCount}
        await Game.findOneAndUpdate(filter,updates);
    }
    if ((myGame.passCount == 3 && myGame.contract != -1)) {
        beginHand(game);
        myGame.passCount=0;
        let filter={_id:game._id}
        let updates={passCount:myGame.passCount}
        await Game.findOneAndUpdate(filter,updates);
        return "gameStart"
    }
    else if(myGame.passCount==4){
       //????? let newFirst=myGame.players[await getPlayerIndex(myGame.startingPlayer,game)];
        return "newCalls"
    }
    else {
        await changeTurn(game);
        return "makeCall";
    }
}

async function handWinner(game){
    let myGame = await Game.findById(game._id);
    let hand=myGame.playedCards;
    let contract=myGame.contract;
    let firstColor=hand[0];
    hand.forEach(el=>{
        if(el.name==firstColor.name){el.suitPower=2}
    })
    if(contract==5){
        hand=hand.sort((a,b)=>{
            if(b.suitPower>a.suitPower)return 1;
            else return b.facePower-a.facePower
        })
        return hand[0];
    }
    else if(contract==4){
        hand=hand.sort((a,b)=>{
            if(b.suitPower>a.suitPower)return 1;
            else return b.facePower-a.facePower
        })
        return hand[0];
    }
    else if(contract==3){
        hand.forEach(el=>{
            if(el.name=="spades"){el.suitPower=3}
        })
        hand=hand.sort((a,b)=>{
            if(b.suitPower>a.suitPower)return 1;
            else return b.facePower-a.facePower
        })
        return hand[0];
    }
    else if(contract==2){
        hand.forEach(el=>{
            if(el.name=="hearts"){el.suitPower=3}
        })
        hand=hand.sort((a,b)=>{
            if(b.suitPower>a.suitPower)return 1;
            else return b.facePower-a.facePower
        })
        return hand[0];
    }
    else if(contract==1){
        hand.forEach(el=>{
            if(el.name=="diams"){el.suitPower=3}
        })
        hand=hand.sort((a,b)=>{
            if(b.suitPower>a.suitPower)return 1;
            else return b.facePower-a.facePower
        })
        return hand[0];
    }
    else if(contract==0){
        hand.forEach(el=>{
            if(el.name=="clubs"){el.suitPower=3}
        })
        hand=hand.sort((a,b)=>{
            if(b.suitPower>a.suitPower)return 1;
            else return b.facePower-a.facePower
        })
        return hand[0];
    }
}

async function sortPremiums(game){
    let myGame = await Game.findById(game._id);
    let team1Confirmed=[];
    let team2Confirmed=[];
    let team1Premiums=myGame.premiums[1];
    let team2Premiums=myGame.premiums[2];
    let biggestTeam1=-2;
    let biggestTeam2=-2;
    team1Premiums.forEach((el)=>{
        if(el[0]==-1)team1Confirmed.push(el);
        else{
            if(el[0]>biggestTeam1)biggestTeam1=el;
            else if(el[0]==biggestTeam1){
                if(el[1].facePower>biggestTeam1.facePower){
                    biggestTeam1=el;
                }
                else if(el[1].facePower==biggestTeam1.facePower){
                    if(el[1].defaultSuitPower>biggestTeam1.defaultSuitPower){
                        biggestTeam1=el;
                    }
                }
            }
        }
    })
    team2Premiums.forEach((el)=>{
        if(el[0]==-1)team2Confirmed.push(el);
        else{
            if(el[0]>biggestTeam2)biggestTeam2=el;
            else if(el[0]==biggestTeam2){
                if(el[1].facePower>biggestTeam2.facePower){
                    biggestTeam2=el;
                }
                else if(el[1].facePower==biggestTeam2.facePower){
                    if(el[1].defaultSuitPower>biggestTeam2.defaultSuitPower){
                        biggestTeam2=el;
                    }
                }
            }
        }
    })
    let winner=-1;
    if(biggestTeam1!=-2&&biggestTeam2!=-2){
        if(biggestTeam1[0]>biggestTeam2[0]){
            //team1
            winner=1;
        }
        else if(biggestTeam1[0]<biggestTeam2[0]){
            //team2
            winner=2;
        }
        else if(biggestTeam1[1].facePower>biggestTeam2[1].facePower){
            //team1
            winner=1;
        }
        else if(biggestTeam1[1].facePower>biggestTeam2[1].facePower){
            //team2
            winner=2;
        }
        else if(biggestTeam1[1].defaultSuitPower>biggestTeam2[1].defaultSuitPower){
            //team1
            winner=1;
        }
        else if(biggestTeam1[1].defaultSuitPower<biggestTeam2[1].defaultSuitPower){
            //team2
            winner=2;
        }
    
    }
    else if(biggestTeam1==-2){
        winner=2;
    }
    else if(biggestTeam2==-2){
        winner=1;
    }
    if(winner==1){
        team1Premiums.forEach(el=>{
            if(el[0]!=-1)team1Confirmed.push(el);
        })
    }
    else if(winner==2){
        team2Premiums.forEach(el=>{
            if(el[0]!=-1)team2Confirmed.push(el);
        })
    }
    else console.log("no winner");
    let filter={_id:myGame._id};
    let updates={premiums:{1:team1Confirmed,2:team2Confirmed}}
    await Game.findOneAndUpdate(filter,updates);
    return myGame;
}

async function gameEnd(game){
    //recalculate point additions etc!
    let myGame=await sortPremiums(game);
    // = await Game.findById(game._id);
    let caller=myGame.teamCalled;
    let contract=myGame.contract;
    let team1Points=myGame.handScore[0];
    let team2Points=myGame.handScore[1];
    let team1PremiumPoints=0;
    let team2PremiumPoints=0;
    let team1Score=0;
    let team2Score=0;
    let team1BelotCount=0;
    let team2BelotCount=0;
    let team1pr=0;
    let team2pr=0;
    let team1Kapo=false;
    let team2Kapo=false;
    if(myGame.lastHandWinner==1){team1PremiumPoints+=10;team1pr+=10;}
    else if(myGame.lastHandWinner==2){team2PremiumPoints+=10;team2pr+=10;}
    myGame.lastHandWinner=-1;
    myGame.premiums[1].forEach(el=>{
        if(el[0]==-1){
            team1PremiumPoints+=20;
            team1BelotCount++;
        }
        else if(el[0]==0){
            team1PremiumPoints+=20;
            team1pr+=20;
        }
        else if(el[0]==1){
            team1PremiumPoints+=50;
            team1pr+=50;
        }
        else if(el[0]==2){
            team1PremiumPoints+=100;
            team1pr+=100;
        }
        else if(el[0]==3){
            if(el[1].face=="J"){team1PremiumPoints+=200;team1pr+=200;}
            else if(el[1].face=="9"){team1PremiumPoints+=150;team1pr+=150}
            else {team1PremiumPoints+=100;team1pr+=100}
        }
    })
    myGame.premiums[2].forEach(el=>{
        if(el[0]==-1){
            team2PremiumPoints+=20;
            team2BelotCount++;
            team2pr+=20;
        }
        else if(el[0]==0){
            team2PremiumPoints+=20;
            team2pr+=20;
        }
        else if(el[0]==1){
            team2PremiumPoints+=50;
            team2pr+=50;
        }
        else if(el[0]==2){
            team2PremiumPoints+=100;
            team2pr+=100;
        }
        else if(el[0]==3){
            if(el[1].face=="J"){team2PremiumPoints+=200;team2pr+=200;}
            else if(el[1].face=="9"){team2PremiumPoints+=150;team2pr+=200;}
            else {team2PremiumPoints+=100;team2pr+=100;}
        }
    })

    console.log(team1Points);
    console.log(team2Points);
    if(team1Points+team1PremiumPoints>team2Points+team2PremiumPoints&&caller==1){
        if(team2Points==0){
            console.log("team2 kapo")
            team1Score+=team1Points+team1PremiumPoints+90;
            team2Kapo=true;

            //change based on game
            team2Score-=100;
            team2Score+=team2PremiumPoints

        }
        else{
            console.log("all ok")
        team1Score+=team1Points+team1PremiumPoints;
        team2Score+=team2Points+team2PremiumPoints;
        }
        
    }
    else if(team1Points>team2Points&&caller==2){
        if(team2Points==0){
            console.log("team2 kapo vutre")
            team2Kapo=true;
            team2Score+=team2Points+team1Points+team1PremiumPoints+team2PremiumPoints+90;

            //change based on game
            team1Score-=100;
        }
        console.log("team 2 vutre")
        team1Score+=team2Points+team1Points+team1PremiumPoints+team2PremiumPoints;
        team2Score-=100;
    }
    else if(team1Points<team2Points&&caller==2){
        if(team1Points==0){
            console.log("team1 kapo")
            team1Kapo=true;
            team2Score+=team2Points+team2PremiumPoints+90;

            //change based on game
            team1Score-=100;
            team2Score+=team1PremiumPoints;
        }
        console.log("everything ok again")
        team1Score+=team1Points+team1PremiumPoints;
        team2Score+=team2Points+team2PremiumPoints;
    }
    else if(team1Points<team2Points&&caller==1){
        if(team1Points==0){
            console.log("team 1 kapo vutre")
            team1Kapo=true;
            team2Score+=team1Points+team2Points+team1PremiumPoints+team2PremiumPoints+90;
        

            //change based on game
            team1Score-=100;
        }
        console.log("team1 vutre")
        team2Score+=team2Points+team1Points+team1PremiumPoints+team2PremiumPoints;
        team1Score-=100;
    }
    else if(team1Points==team2Points){
        //
        //visqshti
        //
        console.log("false")
    }
    if(contract==5){
        if(team1Score>team2Score){
            if(team2Score%10==4){
                team2Score+=10;
            }
        }
        else if(team1Score<team2Score){
            if(team1Score%10==4){
                team1Score+=10;
            }
        }
    }
    else if(contract==4){
        team1Score=team1Score*2;
        team2Score=team2Score*2;
    }
    myGame.score[0]+=Math.round(team1Score/10);
    myGame.score[1]+=Math.round(team2Score/10);
    let filter={_id:game._id};
    let changes={score:[myGame.score[0],myGame.score[1]],handScore:[0,0],lastHandWinner:myGame.lastHandWinner,premiums:{1:[],2:[]}}
    await Game.findOneAndUpdate(filter,changes)
    let result={
        "team1":{
            "belots":team1BelotCount,
            "premium":team1pr,
            "points":team1Points,
            "total":Math.round(team1Score/10)
        },
        "team2":{
            "belots":team2BelotCount,
            "premium":team2pr,
            "points":team2Points,
            "total":Math.round(team2Score/10)
        },
        "contract":contract
    }
    console.log(team1Kapo);
    console.log(team2Kapo)
    if((myGame.score[0]>=151&&team2Kapo==false)||(myGame.score[1]>=151&&team1Kapo==false)){
        console.log("hei hei")
        return {result:result,finished:true}
    }
    return {result,finished:false};
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

async function allowedCards(hand,game){
    let myGame = await Game.findById(game._id);
    let currentHand=myGame.playedCards;
    let highestPower=0;
  
    for(let i=0;i<currentHand.length;i++)
    {
        if(highestPower<currentHand[i].facePower)highestPower=currentHand[i].facePower
    }
    let contract=myGame.contract;
    if(contract==5){
        let sameColor=[]
        hand.forEach(el=>{
            if(el.suit==currentHand[0].suit)sameColor.push(el);
        })
        if(sameColor.length!=0){
            let higherPower=[]
            sameColor.forEach(el=>{
                if(el.facePower>highestPower)higherPower.push(el);
            })
            if(higherPower.length!=0){
                return higherPower;
            }
            else return sameColor;
        }
        else return hand;
    }
    else if(contract==4){
        let sameColor=[];
        hand.forEach(el=>{
            if(el.suit==currentHand[0].suit)sameColor.push(el);
        })
        if(sameColor.length!=0){
            return sameColor;
        }
        else return hand;
    }
    else if(contract==3){
        let sameColor=[];
        hand.forEach(el=>{
            if(el.suit==currentHand[0].suit)sameColor.push(el);
        })
        if(sameColor.length!=0){
            return sameColor;
        }
        else{ 
            let winner=await handWinner(game)
            if(winner.team==hand[0].team){
                return hand;
            }
            else {
                let allowed=[];
                hand.forEach(el=>{
                    if(el.name=="spades")allowed.push(el);
                })
                if(allowed!=0){
                    return allowed
                }
                else return hand;
            }
        }
    }
    else if(contract==2){
        let sameColor=[];
        hand.forEach(el=>{
            if(el.suit==currentHand[0].suit)sameColor.push(el);
        })
        if(sameColor.length!=0){
            return sameColor;
        }
        else{ 
            let winner=await handWinner(game)
            if(winner.team==hand[0].team){
                return hand;
            }
            else {
                let allowed=[];
                hand.forEach(el=>{
                    if(el.name=="hearts")allowed.push(el);
                })
                if(allowed!=0){
                    return allowed
                }
                else return hand;
            }
        }
    }
    else if(contract==1){
        let sameColor=[];
        hand.forEach(el=>{
            if(el.suit==currentHand[0].suit)sameColor.push(el);
        })
        if(sameColor.length!=0){
            return sameColor;
        }
        else{ 
            let winner=await handWinner(game)
            if(winner.team==hand[0].team){
                return hand;
            }
            else {
                let allowed=[];
                hand.forEach(el=>{
                    if(el.name=="diams")allowed.push(el);
                })
                if(allowed!=0){
                    return allowed
                }
                else return hand;
            }
        }
        
    }else if(contract==0){
        let sameColor=[];
        hand.forEach(el=>{
            if(el.suit==currentHand[0].suit)sameColor.push(el);
        })
        if(sameColor.length!=0){
            return sameColor;
        }
        else{ 
            let winner=await handWinner(game)
            if(winner.team==hand[0].team){
                return hand;
            }
            else {
                let allowed=[];
                hand.forEach(el=>{
                    if(el.name=="clubs")allowed.push(el);
                })
                if(allowed!=0){
                    return allowed
                }
                else return hand;
            }
        }
    }
    
}

async function callPremium(highestCard,call,game){
    let myGame = await Game.findById(game._id);
    myGame.premiums[highestCard.team].push([call,highestCard]);
    let filter={_id:myGame._id}
    let updates={premiums:myGame.premiums}
    await Game.findByIdAndUpdate(filter,updates);
    return call;
}

async function checkPremium(highestCard,call,game){
    let myGame = await Game.findById(game._id);
    myGame.premiums[3-highestCard.team].forEach(el=>{
        if(el[0]>call)return false;
    })
    return true;
}
module.exports = {
    dealCards,
    playCard,
    gameStart,
    changeTurn,
    makeCall,
    allowedCards,
    findCard,
    gameEnd,
    callPremium,
    checkPremium,
    findUserInGame,
    updateCards
}