import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from '../services/user.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { SocketService } from '../services/socket.service';
import { LobbyComponent } from '../lobby/lobby.component';
import { interval, Observable } from 'rxjs';
import { PasswordForLobbyComponent } from '../password-for-lobby/password-for-lobby.component';
import {MatDialog} from '@angular/material/dialog';
import { Game } from '../game';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit,OnDestroy {

  constructor(private _auth:AuthService,private router:Router,private _user:UserService,private _socket:SocketService,private _lobby:LobbyComponent,public dialog: MatDialog) { }
  public games:Array<Game>=[];
  interval=interval(1000);
  subInterval:any;
  routeSub:any;
  secret = 'YESRUNFUNCTION';

  ngOnInit(): void {
    this.subInterval=this.interval.subscribe(()=>{if(this._socket.homeUpdated==true){this.getGames();this._socket.homeUpdated=false;}})
    if(localStorage.length==0){
      this._auth.guestUser().subscribe(
        res=>{localStorage.setItem('guest',res.token)},
        err=>{}
      )
    }
    this.getGames();
    //this.games=this.getGames();
   // if(this.games.length==0){
    //}
    
  }

  generate(): any {
    const dialogRef = this.dialog.open(PasswordForLobbyComponent, {
      width: '250px',
    });
    let result=false;
    return dialogRef.afterClosed()
  }

  
  ngOnDestroy(): void {
    this.subInterval.unsubscribe();
}
  getGames():any{
    this.games=[];
    this._user.getGames().subscribe(
      res=>{res.forEach((el:any)=> {
        if(el.active==false&&el.exists==true){
        this.games.push(el)
        }
      });},
      err=>{alert(err.error)}
    )
    this._socket.homeGames();
  }
  join(i:any){
    let user={
      _id:""
    };
    if(!!localStorage.getItem('token')){
      user._id=localStorage.getItem('token')!;
    }
    else user._id=localStorage.getItem('guest')!;
    let game=this.games[i].name;
    let myGame={
      password:""
    }
    if(this.games[i].password){
      this.secret=this.games[i].password
      this.generate().subscribe((password:string) => {
        const isPwdValid = password === this.secret;
        if (isPwdValid) {
          this._user.joinGame(user,game).subscribe(
            res=>{this.router.navigate([`lobby/${res._id}`]);this._socket.joinGame(res._id);},
            err=>{alert(err.error)}
          )
        }
      });
    }
    else{
    this._user.joinGame(user,game).subscribe(
      res=>{this.router.navigate([`lobby/${res._id}`]);this._socket.joinGame(res._id);},
      err=>{alert(err.error)}
    );
    
    }
  }

} 
