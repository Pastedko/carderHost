import { ApplicationInitStatus, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import{io} from "socket.io-client"
import { Game } from '../game';
import { User } from '../user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http:HttpClient,private router:Router,private socket:Socket) { }
  private _createUrl="/create";
  private _getGamesUrl="/getAll";
  private _getGameUrl="/getGame/";
  private _joingGameUrl="/join/";
  private _getUsernameUrl="/getUser/";
  private _getGuestUrl="/getGuest/";
  private _leaveGameUrl="/leaveGame/";
  private _changeTeamUrl="/change/";
  private _updateProfile="/updateWithPicture";
  private _updateProfile2="/updateWithoutPicture";
  private _getPicure="/getPicture";
  private _removePicture="/removePicture"

  createLobby(lobby:Object){
    return this.http.post<any>(this._createUrl,lobby,{
      headers:new HttpHeaders({
        "charset":"utf-8"
      })
    })
  }
  getGames(){
    return this.http.get<any>(this._getGamesUrl)
  }
  joinGame(user:any,game:string){
    return this.http.post<any>(`${this._joingGameUrl}${game}`,user,{
      headers:new HttpHeaders({
        "cjarset":"utf-8"
      })
    })
  }
  getGame(game:any){
    return this.http.get<any>(`${this._getGameUrl}${game}`);
  }
  getUsername(id:string){
    return this.http.get<any>(`${this._getUsernameUrl}${id}`);
  }
  getGuest(id:string){
    return this.http.get<any>(`${this._getGuestUrl}${id}`);
  }
  leaveGame(user:any,game:string){
    return this.http.post<any>(`${this._leaveGameUrl}${game}`,user);
  }
  changeTeam(user:object,game:string){
    return this.http.post<any>(`${this._changeTeamUrl}${game}`,user)
  }
  updateProfile(information:any){
    return this.http.post<any>(`${this._updateProfile}`,information);
  }
  updateProfile2(information:any){
    return this.http.post<any>(`${this._updateProfile2}`,information);
  }
  getPicture(user:User){
    return this.http.post<any>(this._getPicure,{user:user});
  }
  removePicture(user:User){
    return this.http.post<any>(`${this._removePicture}`,{user:user})
  }
}
