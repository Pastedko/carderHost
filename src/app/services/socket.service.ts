import { ApplicationInitStatus, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { io } from "socket.io-client"
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserService } from './user.service';
import { Game } from '../game';



@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private http: HttpClient, private router: Router, private socket: Socket, private _user: UserService) { }
  public notifications: BehaviorSubject<string> = new BehaviorSubject('');
  public hasUpdated:boolean=false;
  public homeUpdated:boolean=false;
  public hasStarted:boolean=false
  createGame(game:any){
    this.socket.emit("gameCreated",game)
  }
  joinGame(game: any) {
    this.socket.emit("gameLobbyJoin", game);
  }
  leaveGame(game:any){
    this.socket.emit("gameLobbyLeft",game);
  }
  gameLobbyUpdate(game:any){
    this.socket.emit("gameLobby",game);
  }
  gameLobby() {
    this.socket.on("gameLobby", (game: any) => {
      this.hasUpdated=true;
    })
  }
  homeGames(){
    this.socket.on("homeGames", () => {
      this.homeUpdated=true;
    })
  }
  getLobbyInfo():boolean{
    return this.hasUpdated;
  }
  public isInLobby() {

  }
  gameHasStarted(){
    this.socket.on("gameStarted",()=>{
      this.hasStarted=true;
    })
  }
  startGame(game:any){
    this.socket.emit("gameStarted",game);
  }
  recconect(game:any){
    this.socket.emit("reconnect",game);
  }
}
