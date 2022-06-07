import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import  {UserService} from '../services/user.service'
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { SocketService } from '../services/socket.service';
@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css']
})
export class CreateComponent implements OnInit {

  constructor(private _auth:AuthService,private router:Router,private _user:UserService,private _socket:SocketService) { }
  createData={
    name:"",
    password:"",
  }

  async ngOnInit(): Promise<void> {
    let user=await this.getUser();
    console.log(typeof user=="number")
    if(typeof user=="number")user="Guest "+user;
    else user=user.username
    this.createData.name=user+"'s game"
  }
  createLobby(){
    let lobby={
      name:this.createData.name,
      password:this.createData.password,
      players:[] as any,
      active:false,
    }
    let player1;
    if(!!localStorage.getItem('token')){
      player1=localStorage.getItem('token')
    }
    else player1=localStorage.getItem('guest')
    lobby.players.push(player1)
    this._user.createLobby(lobby).subscribe(
      res=>{this.router.navigate([`/lobby/${res._id}`]);this._socket.createGame(res._id);},
      err=>alert(err.error)
    );
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
}
