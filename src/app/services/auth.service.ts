import { ApplicationInitStatus, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _registerUrl="http://localhost:3000/register";
  private _loginUrl="http://localhost:3000/login"
  private _guestUrl="http://localhost:3000/guest"
  constructor(private http:HttpClient,private router:Router) { }
  registerUser(user:object){
   
    return this.http.post<any>(this._registerUrl,user,{
      headers:new HttpHeaders({
        "charset":"utf-8"
      })
    })
  }
  loginUser(user:object){
    
    return this.http.post<any>(this._loginUrl,user,{
      headers:new HttpHeaders({
        'Content-Type':'application/json',
        "charset":"utf-8"
      })
    })
  }
  logoutUser(){
    localStorage.removeItem('token');
    this.guestUser().subscribe(
      res=>{localStorage.setItem('guest',res.token)},
      err=>alert(err.error)
    );
    this.router.navigate(['/'])
  }
  guestUser(){
    return this.http.post<any>(this._guestUrl,'',{
      headers:new HttpHeaders({
        "charset":"utf-8"
      })
    })
  }
  isLogged(){
    return !!localStorage.getItem('token')
  }
  getToken(){
    return localStorage.getItem('token');
  }
}
