import { Component, OnInit } from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDialogRef} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatListModule} from '@angular/material/list';

@Component({
  selector: 'app-calls-popup',
  templateUrl: './calls-popup.component.html',
  styleUrls: ['./calls-popup.component.css']
})
export class CallsPopupComponent implements OnInit {

  constructor() { }
  
  ngOnInit(): void {
  }

}
