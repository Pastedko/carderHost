import { Component, Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GameService } from '../services/game.service';
import { SocketService } from '../services/socket.service';
import { UserService } from '../services/user.service';
import { exhaustAll, interval, Observable } from 'rxjs';
import { GameSocketService } from '../services/game-socket.service';
import { Card } from './card';
import { Game } from '../game';
import { i18nMetaToJSDoc } from '@angular/compiler/src/render3/view/i18n/meta';
import { User } from '../user';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})


export class GameComponent implements OnInit {
  
  constructor(private _auth: AuthService, private router: Router, private _user: UserService, private _socket: SocketService, private _game: GameService, private _socketGame: GameSocketService) { }
  public game:any
  public player: any;
  public playerNum: number=0;
  public team:number=0;
  public hand: Card[] = [];
  public deck: Card[] = [];
  public playedCards:Card[]=[];
  public pfp:string[]=[];
  public turn:boolean=false;
  public notInGame=true;
  public callActive=this.notInGame&&this.turn&&this.hand.length<=5;
  public highestCall=-1;
  public clubs:Card[]=[];
  public hearts:Card[]=[];
  public diams:Card[]=[];
  public spades:Card[]=[];
  public team1Score:number=0;
  public team2Score:number=0;
  public cardPassed:boolean=true;
  public premiumsAllowed:boolean=false;
  public interval = interval(1000);
  public call:number=-1;
  public belot:any=false;
  public positions:any[]=[];
  public names:string[]=[];
  public callPlayer1:any;
  public myCalls:string[]|any[]=["Clubs","Diamonds","Hearts","Spades","No trumps","All trumps","Pass"]
  public premiums:any={0:"Tierce",1:"Quarte",2:"Quint",3:"Sqare"}
  public premiumsCalled:any[]=[];
  public usedCards:Card[]=[];
  public scoreScreen:any;
  public hasFinished:boolean=false;
  public win:boolean=false;
  public loss:boolean=false;
  subInterval: any;
  routeSub: any;


  async ngOnInit(): Promise<void> {
    
    this.start();
    this.game = await this.getGame()
    this.player = await this.getUser();
    this.getTeam();
    this.playerNum = this.getPlayerNum();
    await this.isMyTurn();
    this.getPlayerPositions();
  
    this.subInterval = this.interval.subscribe(async () => 
    { 
      //cards dealt
      if (this._socketGame.deck.length != 0) {
        this.hand=[];
        this.deck=[];
        this.deck = this._socketGame.deck; 
        this.dealCards();
        this.sortHand();
        this._socketGame.deck = []; 
        this.game = await this.getGame();
        await this.isMyTurn();
        await this.getPlayerPositions();
        if(this.team==2){
          this.team1Score=this.game.score[1];
          this.team2Score=this.game.score[0];
        }
        else{
        this.team1Score=this.game.score[0];
        this.team2Score=this.game.score[1];
        }
       
      } 

      //card played
      if(this._socketGame.playedCard!=null){
        if(this._socketGame.playedCard!="ended"){
        this.playedCards.push(this._socketGame.playedCard);this.game = await this.getGame();this._socketGame.playedCard=null;
        await this.isMyTurn();
        await this.getPlayerPositions();
        }
        else{
          this.game = await this.getGame()
          this._socketGame.playedCard=null;
          this.isMyTurn();
          await this.getPlayerPositions();
          setTimeout(() => { this.playedCards.splice(0,Math.floor(this.playedCards.length/4)*4);}, 2000);
          this._socketGame.handEnded();
        }
       
      }

      //call made
      if(this._socketGame.call!=-1){
        if(this._socketGame.call!="pass"){
        this.highestCall=this._socketGame.call;
        }


        let index=-1;
        let player=this._socketGame.playerCall;
        for(let i=0;i<this.positions.length;i++){
          if(JSON.stringify(player)==JSON.stringify(this.positions[i][0])){
            index=i;
          }
        }
        if(index!=-1){
          if(this._socketGame.call=="pass"){
            this.premiumsCalled[index]="Pass";
          }
          else
          this.premiumsCalled[index]=this.myCalls[this._socketGame.call];
        }
        setTimeout(() => { this.premiumsCalled[index]=null;}, 4000);
        this._socketGame.call=-1;
        this._socketGame.callMade();
        this.game = await this.getGame();
        await this.isMyTurn();
        await this.getPlayerPositions();

      }

      //gameStarted
      if(this._socketGame.gameStarted==true){
        
        this.dealCards();
        this.rankCards();
        //this.sortHand();
        this._socketGame.gameStarted=false;
        this.notInGame=false;
        this.game = await this.getGame();
        await this.isMyTurn();
        await this.getPlayerPositions();
        this._socket.gameHasStarted();
      }

      //?
      if(this._socketGame.isPlayed==false){
        this.cardPassed=false;
        this._socketGame.isPlayed=true;
      }

      //game ended
      if(this._socketGame.hasEnded==true){
        this.game = await this.getGame();
        this.isMyTurn();
        await this.getPlayerPositions();
        this.team1Score=this.game.score[0];
        this.team2Score=this.game.score[1];
        this._socketGame.hasEnded=false;
        this.notInGame=true;
        this._socketGame.deck=[];
        this._socketGame.startNewGame(this.game);
      }

      //premiums
      if(this.game.handScore[0]==0&&this.game.handScore[1]==0&&this.turn==true&&this.hand.length==8&&this.highestCall!=4){
        this.premiumsAllowed=true;
      }
      else this.premiumsAllowed=false;

      if(this._socketGame.premium!=-1){
        let index=-1;
        let player=this._socketGame.premium.player;
        for(let i=0;i<this.positions.length;i++){
          if(JSON.stringify(player)==JSON.stringify(this.positions[i][0])){
            index=i;
          }
        }
        if(index!=-1){
          this.premiumsCalled[index]=this.premiums[this._socketGame.premium.call];
        }
        this._socketGame.premium=-1;
        setTimeout(() => { this.premiumsCalled[index]=null;}, 4000);
      }


      //belot
      if(this._socketGame.belot!=false){
        this._socketGame.belotCalled();
        this.belot=this._socketGame.belot;
        this._socketGame.belot=false;
        let player=this.belot.player;
        let index=-1;
        for(let i=0;i<this.positions.length;i++){
          if(JSON.stringify(player)==JSON.stringify(this.positions[i][0])){
            index=i;
          }
        }
        if(index!=-1){
          this.premiumsCalled[index]="Belot";
        }
        setTimeout(() => { this.premiumsCalled[index]=null;this.belot=false;}, 4000);
      }

      //showResult
      if(this._socketGame.showResults!=false){
        this.scoreScreen=this._socketGame.showResults;
        this._socketGame.showResults=false;
        if(this.team==2){
          let sub=this.scoreScreen["team1"];
          this.scoreScreen["team1"]=this.scoreScreen["team2"];
          this.scoreScreen["team2"]=sub;
        };
        this.highestCall=-1;
        setTimeout(() => { this.scoreScreen=null;}, 4000);
        this._socketGame.showResult();
      }

      //gameFinished
      if(this._socketGame.gameHasFinished!=false){
        this._socketGame.gameHasFinished=false;
        this._game.gameFinished(this.game,this.player);
        this.hasFinished=true;
        this.game=await this.getGame();
        if(this.game.score[0]>this.game.score[1]&&this.team==1){
          this.win=true;
          //this.results.push("Win");
        }
        else if(this.game.score[0]>this.game.score[1]&&this.team==2){
          this.loss=true;
         // this.results.push("Loss");
        }
        else if(this.game.score[0]<this.game.score[1]&&this.team==1){
          this.loss=true;
         // this.results.push("Loss")
        }
        else if(this.game.score[0]<this.game.score[1]&&this.team==2){
          this.win=true;
         // this.results.push("WIN")
        }
       
      }
    })

   
    await this.reconnect();

  }

  start(){
    this._socketGame.dealCards();
    this._socketGame.cardPlayed();
    this._socketGame.callMade();
    this._socketGame.startGame();
    this._socketGame.handEnded();
    this._socketGame.gameEnded();
    this._socketGame.premiumCalled();
    this._socketGame.belotCalled();
    this._socketGame.showResult();
    this._socketGame.gameFinished();
  }

  rankCards(){
    if(this.highestCall==5){
      this.deck.forEach(el=>{
        if(el.face=="J"){el.facePower=17;el.points=20;}
        else
        if(el.face=="9"){el.facePower=16;el.points=14;}
      })
    }
    else if(this.highestCall==3){
      this.deck.forEach(el=>{
        if(el.face=="J" && el.name=="spades"){el.facePower=17;el.points=20;el.suitPower=3;}
        else
        if(el.face=="9"&& el.name=="spades"){el.facePower=16;el.points=14;el.suitPower=3;}
      })
    }
    else if(this.highestCall==2){
      this.deck.forEach(el=>{
        if(el.face=="J" && el.name=="hearts"){el.facePower=17;el.points=20;el.suitPower=3;}
        else
        if(el.face=="9"&& el.name=="hearts"){el.facePower=16;el.points=14;el.suitPower=3;}
      })
    }
    else if(this.highestCall==1){
      this.deck.forEach(el=>{
        if(el.face=="J" && el.name=="diams"){el.facePower=17;el.points=20;el.suitPower=3;}
        else
        if(el.face=="9"&& el.name=="diams"){el.facePower=16;el.points=14;el.suitPower=3;}
      })
    }
    else if(this.highestCall==0){
      this.deck.forEach(el=>{
        if(el.face=="J" && el.name=="clubs"){el.facePower=17;el.points=20;el.suitPower=3;}
        else
        if(el.face=="9"&& el.name=="clubs"){el.facePower=16;el.points=14;el.suitPower=3;}
      })
    }
    this.sortHand();
  }
  async getGame() {
    this.game = this.router.parseUrl(this.router.url).root.children['primary'].segments[1].path;
    let res = this._user.getGame(this.game).toPromise();
    return res;
  }
  async getUser() {
    let user;
    if (!!localStorage.getItem('token')) {
      user = localStorage.getItem('token')!;
      let res = this._user.getUsername(user).toPromise();
      return res;
    }
    else {
      user = localStorage.getItem('guest')!;
      let res = this._user.getGuest(user).toPromise();
      return res;
    }
  }
  async getTeam(){
    let team=0;
    this.game.players.forEach((el:any) => {
      if(JSON.stringify(el[0])==JSON.stringify(this.player))team=el[1];
    });
    this.team=team;
  }
  getPlayerNum() {
    let num = -1;
    for (let i = 0; i < this.game.players.length; i++) {
      if ((this.game.players[i][0]._id == this.player._id&&!!this.player._id) || this.game.players[i][0] == this.player) num = i;
    }
    return num;
  }
  isMyTurn(){
    let playerInGame=this.game.players[0];
    this.game.players.forEach((el:any) => {
      if(el[0]==this.player||(el[0].username==this.player.username&&this.player.username!=null)){
        playerInGame=el;
      }
    });
    this.turn=playerInGame[2];
    this.callActive=this.notInGame&&this.turn&&this.hand.length<=5;
    console.log(this.game.handScore[0]==0)
    console.log(this.game.handScore[1]==0)
    console.log(this.turn==true);
    console.log(this.notInGame==false);
    console.log(this.highestCall);
    if(this.game.handScore[0]==0&&this.game.handScore[1]==0&&this.turn==true&&this.hand.length==8&&this.highestCall!=4){
      this.premiumsAllowed=true;
    }
    else this.premiumsAllowed=false;
  }
  dealCards() {
    this.playerNum = this.getPlayerNum();
    this.playedCards=[];
    if(this.hand.length==5)
    {
      for (let i =20+ this.playerNum * 3; i <20+ this.playerNum*3 + 3; i++) {
        this.deck[i].player=this.player
        this.deck[i].team=this.team;
        switch(this.deck[i].name){
          case "spades":{this.spades.push(this.deck[i]);break;}
          case "clubs":{this.clubs.push(this.deck[i]);break;}
          case "hearts":{this.hearts.push(this.deck[i]);break;}
          case "diams":{this.diams.push(this.deck[i]);break;}
        }
      }
    }
    else{
      this.hand.length=0;
      this.spades.length=0;
      this.clubs.length=0;
      this.hearts.length=0;
      this.diams.length=0;
      this.notInGame=true;
    for (let i = this.playerNum * 5; i < this.playerNum*5 + 5; i++) {
      this.deck[i].player=this.player
      this.deck[i].team=this.team;
      switch(this.deck[i].name){
        case "spades":{this.spades.push(this.deck[i]);break;}
        case "clubs":{this.clubs.push(this.deck[i]);break;}
        case "hearts":{this.hearts.push(this.deck[i]);break;}
        case "diams":{this.diams.push(this.deck[i]);break;}
      }
    }} 


  }
   checkBelot(card:Card){
    if(card.face=="Q"){
      let found=this.hand.filter((el:Card)=>{
       return  el.face=="K"&&el.name==card.name
      })
      if(found.length!=0)return true;
      return false
    }
    else if(card.face=="K"){
      let found=this.hand.filter((el:Card)=>{
        return el.face=="Q"&&el.name==card.name
      })
      if(found.length!=0)return true;
      return false
    }
    else return false;
  }
  async playCard(index:number){
    if(this.turn&&!this.callActive){
      let card=this.hand[index];
      let res=await this._game.isAllowed(card,this.hand,this.game).toPromise();
      setTimeout(()=>{},100);
      if(res){
        if(this.playedCards.length<4){
        if(this.checkBelot(card)==true){
          card.belot=true;
        }
        this._socketGame.playCard(card,this.hand,this.game);
        this.hand.splice(index,1)
        this.cardPassed=true;
        this.turn=false;
        this.sendCards();
      }
    }}
  }
  sortHand(){
    this.spades.sort((a:Card,b:Card)=>{
      return a.facePower-b.facePower;
    })
    this.clubs.sort((a:Card,b:Card)=>{
      return a.facePower-b.facePower;
    })
    this.hearts.sort((a:Card,b:Card)=>{
      return a.facePower-b.facePower;
    })
    this.diams.sort((a:Card,b:Card)=>{
      return a.facePower-b.facePower;
    })
    this.hand.splice(0,this.hand.length);
    if(this.clubs.length==0){
      this.diams.forEach((el)=>this.hand.push(el))
      this.spades.forEach((el)=>this.hand.push(el))
      this.hearts.forEach((el)=>this.hand.push(el))
    }
    else if(this.hearts.length==0){
      this.clubs.forEach((el)=>this.hand.push(el))
      this.diams.forEach((el)=>this.hand.push(el))
      this.spades.forEach((el)=>this.hand.push(el))
    }else{
      this.diams.forEach((el)=>this.hand.push(el))
      this.clubs.forEach((el)=>this.hand.push(el))
      this.hearts.forEach((el)=>this.hand.push(el))
      this.spades.forEach((el)=>this.hand.push(el))
    }
    if(this.deck.length!=0){
      console.log("2")
      this.sendCards()
      }
  }
  async makeCall(index:number){
    if(index>this.highestCall){
      this._socketGame.makeCall(index,this.team,this.game,this.player);
    }
    this.game = await this.getGame();
    await this.isMyTurn();
    await this.getPlayerPositions();
  }
  callPremium(index:number){
    let result=this.canCallPremium(index);
    if(result!=false){
      this._socketGame.callPremium(index,result,this.game);
    }
  }
  canCallPremium(index:number){
    this.clubs.sort((a,b)=>{
      return a.cardOrder-b.cardOrder
    })
    this.diams.sort((a,b)=>{
      return a.cardOrder-b.cardOrder
    })
    this.hearts.sort((a,b)=>{
      return a.cardOrder-b.cardOrder
    })
    this.spades.sort((a,b)=>{
      return a.cardOrder-b.cardOrder
    })


    this.clubs=this.clubs.filter((el:Card)=>{
      return !this.usedCards.includes(el)
    })
    this.diams=this.diams.filter((el:Card)=>{
      return !this.usedCards.includes(el)
    })
    this.spades=this.spades.filter((el:Card)=>{
      return !this.usedCards.includes(el)
    })
    this.hearts=this.hearts.filter((el:Card)=>{
      return !this.usedCards.includes(el)
    })


    if(index==0){
      for(let i=1;i<this.clubs.length-1;i++){
        if(this.clubs[i].cardOrder==this.clubs[i-1].cardOrder+1&&this.clubs[i].cardOrder+1==this.clubs[i+1].cardOrder){
          this.usedCards.push(this.clubs[i]);
          this.usedCards.push(this.clubs[i-1]);
          this.usedCards.push(this.clubs[i+1]);
          return this.clubs[i+1];
        }
      }
      for(let i=1;i<this.diams.length-1;i++){
        if(this.diams[i].cardOrder==this.diams[i-1].cardOrder+1&&this.diams[i].cardOrder+1==this.diams[i+1].cardOrder){
          this.usedCards.push(this.diams[i]);
          this.usedCards.push(this.diams[i-1]);
          this.usedCards.push(this.diams[i+1]);
         return this.diams[i+1]
        }
      }
      for(let i=1;i<this.hearts.length-1;i++){
        if(this.hearts[i].cardOrder==this.hearts[i-1].cardOrder+1&&this.hearts[i].cardOrder+1==this.hearts[i+1].cardOrder){
          this.usedCards.push(this.hearts[i]);
          this.usedCards.push(this.hearts[i-1]);
          this.usedCards.push(this.hearts[i+1]);
          return this.hearts[i+1]
        }
      }
      for(let i=1;i<this.spades.length-1;i++){
        if(this.spades[i].cardOrder==this.spades[i-1].cardOrder+1&&this.spades[i].cardOrder+1==this.spades[i+1].cardOrder){
          this.usedCards.push(this.spades[i]);
          this.usedCards.push(this.spades[i-1]);
          this.usedCards.push(this.spades[i+1]);
          return this.spades[i+1]
        }
      }
      return false;
      //terca
    }
    else if(index==1){
      //50

      for(let i=1;i<this.clubs.length-2;i++){
        if(this.clubs[i].cardOrder==this.clubs[i-1].cardOrder+1&&this.clubs[i].cardOrder+1==this.clubs[i+1].cardOrder&&this.clubs[i+1].cardOrder+1==this.clubs[i+2].cardOrder){
          this.usedCards.push(this.clubs[i]);
          this.usedCards.push(this.clubs[i-1]);
          this.usedCards.push(this.clubs[i+1]);
          this.usedCards.push(this.clubs[i+2]);
          return this.clubs[i+2]
        }
      }
      for(let i=1;i<this.diams.length-2;i++){
        if(this.diams[i].cardOrder==this.diams[i-1].cardOrder+1&&this.diams[i].cardOrder+1==this.diams[i+1].cardOrder&&this.diams[i+1].cardOrder+1==this.diams[i+2].cardOrder){
          this.usedCards.push(this.diams[i]);
          this.usedCards.push(this.diams[i-1]);
          this.usedCards.push(this.diams[i+1]);
          this.usedCards.push(this.diams[i+2]);
          return this.diams[i+2]
        }
      }
      for(let i=1;i<this.hearts.length-2;i++){
        if(this.hearts[i].cardOrder==this.hearts[i-1].cardOrder+1&&this.hearts[i].cardOrder+1==this.hearts[i+1].cardOrder&&this.hearts[i+1].cardOrder+1==this.hearts[i+2].cardOrder){
          this.usedCards.push(this.hearts[i]);
          this.usedCards.push(this.hearts[i-1]);
          this.usedCards.push(this.hearts[i+1]);
          this.usedCards.push(this.hearts[i+2]);
          return this.hearts[i+2]
        }
      }
      for(let i=1;i<this.spades.length-1;i++){
        if(this.spades[i].cardOrder==this.spades[i-1].cardOrder+1&&this.spades[i].cardOrder+1==this.spades[i+1].cardOrder&&this.spades[i+1].cardOrder+1==this.spades[i+2].cardOrder){
          this.usedCards.push(this.spades[i]);
          this.usedCards.push(this.spades[i-1]);
          this.usedCards.push(this.spades[i+1]);
          this.usedCards.push(this.spades[i+2]);
          return this.spades[i+2]
        }
      }

      return false;
    }
    else if(index==2){
      //100

      for(let i=1;i<this.clubs.length-3;i++){
        if(this.clubs[i].cardOrder==this.clubs[i-1].cardOrder+1&&this.clubs[i].cardOrder+1==this.clubs[i+1].cardOrder&&this.clubs[i+1].cardOrder+1==this.clubs[i+2].cardOrder
          &&this.clubs[i+2].cardOrder+1==this.clubs[i+3].cardOrder){
            this.usedCards.push(this.clubs[i]);
            this.usedCards.push(this.clubs[i-1]);
            this.usedCards.push(this.clubs[i+1]);
            this.usedCards.push(this.clubs[i+2]);
            this.usedCards.push(this.clubs[i+3]);
          return this.clubs[i+3];
        }
      }
      for(let i=1;i<this.diams.length-3;i++){
        if(this.diams[i].cardOrder==this.diams[i-1].cardOrder+1&&this.diams[i].cardOrder+1==this.diams[i+1].cardOrder&&this.diams[i+1].cardOrder+1==this.diams[i+2].cardOrder
          &&this.diams[i+2].cardOrder+1==this.diams[i+3].cardOrder){
            this.usedCards.push(this.diams[i]);
            this.usedCards.push(this.diams[i-1]);
            this.usedCards.push(this.diams[i+1]);
            this.usedCards.push(this.diams[i+2]);
            this.usedCards.push(this.diams[i+3]);
         return this.diams[i+3];
        }
      }
      for(let i=1;i<this.hearts.length-3;i++){
        if(this.hearts[i].cardOrder==this.hearts[i-1].cardOrder+1&&this.hearts[i].cardOrder+1==this.hearts[i+1].cardOrder&&this.hearts[i+1].cardOrder+1==this.hearts[i+2].cardOrder
          &&this.hearts[i+2].cardOrder+1==this.hearts[i+3].cardOrder){
            this.usedCards.push(this.hearts[i]);
            this.usedCards.push(this.hearts[i-1]);
            this.usedCards.push(this.hearts[i+1]);
            this.usedCards.push(this.hearts[i+2]);
            this.usedCards.push(this.hearts[i+3]);
          return this.hearts[i+3];
        }
      }
      for(let i=1;i<this.spades.length-3;i++){

        if(this.spades[i].cardOrder==this.spades[i-1].cardOrder+1&&this.spades[i].cardOrder+1==this.spades[i+1].cardOrder&&this.spades[i+1].cardOrder+1==this.spades[i+2].cardOrder
          &&this.spades[i+2].cardOrder+1==this.spades[i+3].cardOrder){
            this.usedCards.push(this.spades[i]);
            this.usedCards.push(this.spades[i-1]);
            this.usedCards.push(this.spades[i+1]);
            this.usedCards.push(this.spades[i+2]);
            this.usedCards.push(this.spades[i+3]);
          return this.spades[i+3];
        }
      }
      return false;
    }
    else if(index==3){
      //4 ednakvi

      if(this.spades.length==0||this.hearts.length==0||this.clubs.length==0||this.diams.length==0){
        return false
      }else{
        let result=false;
        let card;
        this.spades.forEach(el=>{
          if(this.hearts.filter(elem=>elem.face==el.face).length!=0
          &&this.diams.filter(elem=>elem.face==el.face).length!=0
          &&this.clubs.filter(elem=>elem.face==el.face).length!=0&&(el.name!=="7"&&el.name!="8")){result=true;card=el;}
        })
        if(result==false){
          return false
        }
        else return card;
      }
    }
    return false;
  }
  getPlayerPositions(){
    this.positions=[];
    this.positions.push([this.player])
    if(this.player.profilePicture!=null){
      this.pfp.push(this.player.profilePicture);
    }
    else this.pfp.push("/uploads/guest-user-250x250.jpg");
    if(this.player.username!=undefined){
      this.names.push(this.player.username);
    }
    else {
      this.names.push("Guest "+this.player);
    }
    let index=this.playerNum;
    let team=this.team;
    for(let i=1;i<4;i++){
    if (team == 1) {
      this.positions.push(this.game.players[ index+ 2])
      index=index+2;
      if(this.game.players[index][0].profilePicture!=null){
        this.pfp.push(this.game.players[index][0].profilePicture);
      }
      else this.pfp.push("/uploads/guest-user-250x250.jpg")
      if(this.game.players[index][0].username!=undefined){
        this.names.push(this.game.players[index][0].username);
      }
      else {
        this.names.push("Guest "+this.game.players[index][0]);
      }
      team=this.game.players[index][1];
  }
  else {
      if (index == 3) {
        this.positions.push(this.game.players[ index-3])
        index=index-3;
        if(this.game.players[index][0].profilePicture!=null){
          this.pfp.push(this.game.players[index][0].profilePicture);
        }
        else this.pfp.push("/uploads/guest-user-250x250.jpg")
        if(this.game.players[index][0].username!=undefined){
          this.names.push(this.game.players[index][0].username);
        }
        else {
          this.names.push("Guest "+this.game.players[index][0]);
        }
        team=this.game.players[index][1];
      }
      else {
        this.positions.push(this.game.players[ index-1])
        index=index-1;
        if(this.game.players[index][0].profilePicture!=null){
          this.pfp.push(this.game.players[index][0].profilePicture);
        }
        else this.pfp.push("/uploads/guest-user-250x250.jpg")
        if(this.game.players[index][0].username!=undefined){
          this.names.push(this.game.players[index][0].username);
        }
        else {
          this.names.push("Guest "+this.game.players[index][0]);
        }
        team=this.game.players[index][1];
      }
  }
  }
}
  async reconnect(){
    this.game=await this.getGame();
    this._socketGame.reconnect(this.game,this.player);
    let index=-1;
    for(let i=0;i<4;i++){
      if(JSON.stringify(this.game.players[i][0])==JSON.stringify(this.player)||this.game.players[i][0]==this.player)index=i;
    }
    this.hand=this.game.cards[index];
    this.playedCards=this.game.playedCards;
    this.highestCall=this.game.contract;
    await this.isMyTurn();
   
    console.log(this.game);
    console.log(this.premiumsAllowed)
  }
  continue(){
    this.router.navigate(['/']);
  }
  sendCards(){
    this._socketGame.submitCards(this.hand,this.game,this.player);
  }

}
