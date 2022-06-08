import { Component, OnInit } from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDialogRef} from '@angular/material/dialog';
@Component({
  selector: 'app-password-for-lobby',
  templateUrl: './password-for-lobby.component.html',
  styleUrls: ['./password-for-lobby.component.css']
})
export class PasswordForLobbyComponent  {
  password = '';
  constructor( public dialogRef: MatDialogRef<PasswordForLobbyComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
