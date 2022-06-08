import { Game } from "./game";
export class User{
    _id:string="";
    username:string="";
    email:string="";
    hashedPassword:string="";
    currentGame:Game;
    allGames:Game[]=[];
    constructor(currentGame:Game){
        this.currentGame=currentGame;
    }
}