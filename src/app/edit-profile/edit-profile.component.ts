import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  constructor(private http:HttpClient,private _user:UserService,public router:Router) { }
  public selectedFile:File|any=null;
  public removed:boolean=false;
  public updates:any={
    username:"",
    birthday:"",
    city:"",
    gender:"",
    profilePicture:"",
    user:""
  }
  url=""
  pipe = new DatePipe('en-US');
  public user:any;
  async ngOnInit(): Promise<void> {
    this.removed=false;
    this.user=await this.getUser();
    this.updates.username=this.user.username;
    this.updates.birthday=this.user.birthday;
    this.updates.city=this.user.city;
    this.updates.gender=this.user.gender;
    this.updates.user=this.user
    this.updates.birthday = this.pipe.transform(this.updates.birthday, 'yyyy-MM-dd');
    this.updates.profilePicture=this.user.profilePicture;
   // this.getPicture();
      this.url=this.user.profilePicture
    
  }
  fileSelected(event:any){
    if(event.target.files){
    this.selectedFile=<File>event.target.files[0];
    var reader=new FileReader();
    reader.readAsDataURL(this.selectedFile);
    reader.onload=(event:any)=>{
      this.url=event.target.result;
    }
  }
  }
  setPicture(picture:any){
    var reader=new FileReader();
    reader.readAsDataURL(picture);
    reader.onload=(event:any)=>{
      this.url=event.target.result;
    }
  }
  getPicture(){
    let res=this._user.getPicture(this.user).toPromise();
  }
  getUser(){
    let user;
    if (!!localStorage.getItem('token')) {
      user = localStorage.getItem('token')!;
      let res = this._user.getUsername(user).toPromise();
      return res;
    }
    return false;
  }
  save(){
    const fd=new FormData();
    fd.set('username',this.updates.username);
    fd.set("birthday",this.updates.birthday);
    fd.set("city",this.updates.city);
    fd.set("gender",this.updates.gender);
    fd.set("user",this.user._id);
    if(this.selectedFile!=null&&!this.url.includes("http://localhost")){
    fd.set('profilePicture',this.selectedFile);
    this._user.updateProfile(fd).subscribe(
    res=>{this.router.navigate([`/profile/${String(this.user._id)}`])},
    err=>{alert(err.error)});
    }
    else {
      fd.set("profilePicture",this.updates.profilePicture)
      this._user.updateProfile2(fd).subscribe(
      res=>{this.router.navigate([`/profile/${String(this.user._id)}`])},
      err=>{alert(err.error)});

      if(this.removed==true){
        this._user.removePicture(this.user);
      }
    }
   
  }
  removePicture(){
    this.updates.profilePicture="http://localhost:3000/uploads/guest-user-250x250.jpg"
    this.url="http://localhost:3000/uploads/guest-user-250x250.jpg";
    this.removed=true;
  }

}
