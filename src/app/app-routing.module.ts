import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainViewComponent } from 'src/view/main-view/main-view.component';

const routes: Routes = [
  {
    path: '',
    component: MainViewComponent
    //loadChildren: () => import('../view/main-view/main-view.module').then(m => m.MainViewModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
