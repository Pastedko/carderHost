import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateComponent } from './create/create.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { GameComponent } from './game/game.component';
import { AuthGuard } from './guards/auth.guard';
import { IsNotLoggedGuard } from './guards/is-not-logged.guard';
import { HomeComponent } from './home/home.component';
import { LobbyComponent } from './lobby/lobby.component';
import { LoginComponent } from './login/login.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ProfileComponent } from './profile/profile.component';
import { RegisterComponent } from './register/register.component';

const routes: Routes = [
  {path:"register",component:RegisterComponent,canActivate:[IsNotLoggedGuard]},
  {path:"",component:HomeComponent},
  {path:"login",component:LoginComponent,canActivate:[IsNotLoggedGuard]},
  {path:"create",component:CreateComponent},
  {path:"lobby/:id",component:LobbyComponent},
  {path:"game/:id",component:GameComponent},
  {path:"profile/:id",component:ProfileComponent,canActivate:[AuthGuard]},
  {path:"edit/:id",component:EditProfileComponent,canActivate:[AuthGuard]},
  {path:"**",pathMatch:'full',component:NotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
