import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './main/main.component';
import { SettingsComponent } from './settings/settings.component';
import { ConfigurationComponent } from './configuration/configuration.component';
import { AresComponent } from './ares/ares.component';

const routes: Routes = [
  { path: '', component: AresComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'config', component: ConfigurationComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
