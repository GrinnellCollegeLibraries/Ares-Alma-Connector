import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConfigurationComponent } from './configuration/configuration.component';
import { AresComponent } from './ares/ares.component';

const routes: Routes = [
  { path: '', component: AresComponent },
  { path: 'configuration', component: ConfigurationComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
