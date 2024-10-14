import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ZabbixComponent } from './zabbix/zabbix.component';

const routes: Routes = [{ path: '', component: ZabbixComponent }];

@NgModule({
  declarations: [ZabbixComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export default class ZabbixModule {}
