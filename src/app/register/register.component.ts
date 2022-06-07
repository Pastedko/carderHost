import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { NavigationComponent } from '../navigation/navigation.component';
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerUserData={
    "username":"",
    "email":"",
    "password":"",
    "passwordAgain":""
  };
  constructor(private _auth:AuthService,private router:Router,private cookieService:CookieService,private navbar:NavigationComponent) { }
  register(){
    this._auth.registerUser(this.registerUserData).subscribe(
      res=>{localStorage.clear();localStorage.setItem('token',res.token);this.navbar.getUser();this.router.navigate(['/']);},
      err=>{alert(err.error.text);alert(err.error.text)}
    )
  }
  ngOnInit(): void {
  }

}


