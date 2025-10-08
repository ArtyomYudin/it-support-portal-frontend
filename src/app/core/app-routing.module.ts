// import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';

import { AuthGuard } from '@service/auth.guard.service';
import {LoginPageComponent} from "@feature/login-page/login-page.component";
import {DhcpComponent} from "@feature/dhcp/dhcp.component";
import {PacsComponent} from "@feature/pacs/pacs.component";
import {UserRequestComponent} from "@feature/user-request/user-request.component";

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('../features/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_home' },
    data: { reuseRoute: false },
  },
  {
    path: 'user-request',
    loadComponent: () => import('../features/user-request/user-request.component').then(m => m.UserRequestComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_user_request' },
    data: { reuseRoute: true },
  },
  {
    path: 'purchase',
    // loadChildren: () => import('../features/purchase/purchase.module').then(m => m.PurchaseModule),
    canActivate: [AuthGuard],
    // data: { key: 'cached_purchase' },
    data: { reuseRoute: true },
  },
  {
    path: 'pacs',
    loadComponent: () => import('../features/pacs/pacs.component').then(m => m.PacsComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_pacs' },
    data: { reuseRoute: false },
  },
  {
    path: 'avaya',
    loadComponent: () => import('../features/avaya/avaya.component').then(m => m.AvayaComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_avaya' },
    data: { reuseRoute: true },
  },
  {
    path: 'dhcp',
    loadComponent: () => import('../features/dhcp/dhcp.component').then(m => m.DhcpComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_dhcp' },
    data: { reuseRoute: true },
  },
  {
    path: 'vpn',
    loadComponent: () => import('../features/vpn/vpn.component').then(m => m.VpnComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_vpn' },
    data: { reuseRoute: true },
  },
  {
    path: 'zabbix',
    loadChildren: () => import('../features/zabbix/zabbix.module'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_vpn' },
    data: { reuseRoute: true },
  },
  {
    path: 'vss',
    loadComponent: () => import('../features/vss/vss.component').then(m => m.VssComponent),
    canActivate: [AuthGuard],
    // data: { key: 'cached_vpn' },
    data: { reuseRoute: true },
  },
  {
    path: 'setting',
    // loadChildren: () => import('../features/setting/setting.module'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_setting' },
    data: { reuseRoute: true },
  },
  { path: 'login', loadComponent: () => import('../features/login-page/login-page.component').then(m => m.LoginPageComponent) },
  { path: '**', redirectTo: '' },
];

// @NgModule({
//  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
//  exports: [RouterModule],
// })
// export class AppRoutingModule {}
