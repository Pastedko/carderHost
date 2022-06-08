import { Card } from "./game/card";
import { User } from "./user";
export class Game{
    players:any
    active:boolean=false
    score:number[]=[];
    handScore:number[]=[];
    premiums:object={1:[],2:[]}
    contract:number=-1;
    teamCalled:number=0;
    password:string="";
    name:string="";
    startingPlayer:User;
    lastStarted:User;
    playedCards:Card[]=[];
    passCount:number=0;
    deck:Card[]=[];
    constructor(startingPlayer:User,lastStarted:User){
        this.startingPlayer=startingPlayer;
        this.lastStarted=lastStarted;
    }
}