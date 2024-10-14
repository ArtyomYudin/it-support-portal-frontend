// import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';

import { AuthGuard } from '@service/auth.guard.service';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('../features/home/home.component'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_home' },
    data: { reuseRoute: false },
  },
  {
    path: 'user-request',
    loadComponent: () => import('../features/user-request/user-request.component'),
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
    loadComponent: () => import('../features/pacs/pacs.component'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_pacs' },
    data: { reuseRoute: false },
  },
  {
    path: 'avaya',
    loadComponent: () => import('../features/avaya/avaya.component'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_avaya' },
    data: { reuseRoute: true },
  },
  {
    path: 'dhcp',
    loadComponent: () => import('../features/dhcp/dhcp.component'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_dhcp' },
    data: { reuseRoute: true },
  },
  {
    path: 'vpn',
    loadComponent: () => import('../features/vpn/vpn.component'),
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
    path: 'setting',
    // loadChildren: () => import('../features/setting/setting.module'),
    canActivate: [AuthGuard],
    // data: { key: 'cached_setting' },
    data: { reuseRoute: true },
  },
  { path: 'login', loadComponent: () => import('../features/login-page/login-page.component') },
  { path: '**', redirectTo: '' },
];

// @NgModule({
//  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
//  exports: [RouterModule],
// })
// export class AppRoutingModule {}
