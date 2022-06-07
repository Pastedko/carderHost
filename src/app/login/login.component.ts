import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import {CookieService} from 'ngx-cookie-service'
import { NavigationComponent } from '../navigation/navigation.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private _auth:AuthService,private router:Router,private cookieService:CookieService,private navbar:NavigationComponent) { }
  loginUserData={
    email:"",
    password:""
  }
  ngOnInit(): void {
  }
  login(){
    this._auth.loginUser(this.loginUserData).subscribe(
      res=>{localStorage.clear();localStorage.setItem('token',res.token);this.navbar.getUser();this.router.navigate(['/']);},
      err=>alert(err.error)
    )
  }

}
