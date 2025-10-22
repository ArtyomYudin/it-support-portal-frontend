// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {Camera} from "@model/camera.model";

export const environment = {
  production: false,
  apiHost: '127.0.0.1:8000',
  apiPort: 8000,
  apiTestURL: 'ws/',
  apiUrl: 'http://127.0.0.1:8000/api',
  jwtLogin: 'token',
  jwtRefresh: 'token/refresh',
  webSocketPath: 'api/ws',
  vssSocketPath: 'vss',
  chatBotAskSSEUrl: '/ask/sse',
  chatBotHost: '172.20.4.50:8008',

  cameras: [
    { id: 'floor2_left_wing', name: '2 эт. левое крыло', location: 'Second Floor Left Wing' },
    { id: 'floor2_right_wing', name: '2 эт. правое крыло(списан)', location: 'Second Floor Right Wing (Scrapped)' },
    { id: 'floor1_left_wing', name: '1 эт. левое крыло', location: 'First Floor Left Wing' },
    { id: 'basement_left_wing', name: 'цоколь левое крыло', location: 'Basement Left Wing' },
    { id: 'basement_right_wing', name: 'цоколь правое крыло', location: 'Basement Right Wing' },
    { id: 'central_entrance', name: 'центральный вход', location: 'Central Entrance' },
    { id: 'floor1_right_wing', name: '1 эт. правое крыло', location: 'First Floor Right Wing' },
    { id: 'floor2_center', name: '2 этаж центр', location: 'Second Floor Center' },
    { id: 'auto_warehouse', name: 'автосклад', location: 'Auto Warehouse' },
    { id: 'black_entrance', name: 'черный вход', location: 'Black Entrance' },
    { id: 'central_entrance_2', name: 'центральный вход 2', location: 'Central Entrance 2' },
    { id: 'floor1_left_wing_panel', name: '1 эт. левое крыло щит', location: 'First Floor Left Wing Panel' },
    { id: 'street_entrance', name: 'вход улица', location: 'Street Entrance' },
    { id: 'server_room', name: 'серверная', location: 'Server Room' },
    { id: 'basement_entrance', name: 'вход в цокольный этаж', location: 'Basement Entrance' },
    { id: 'black_entrance_street', name: 'Черный вход улица', location: 'Black Entrance Street' },
    { id: 'work_hall', name: 'рабочий зал', location: 'Work Hall' },
    { id: 'waiting_hall', name: 'зал ожидания', location: 'Waiting Hall' },
    { id: 'foyer_reception', name: 'Фойе ресепшн', location: 'Foyer Reception' },
    { id: 'floor2_left_wing_stairs', name: '2 эт. левое крыло лестн', location: 'Second Floor Left Wing Stairs' },
    { id: 'corridor_right_wing', name: 'коридор правое крыло', location: 'Corridor Right Wing' },
    { id: 'rso_basement', name: 'РСО цок.этаж', location: 'RSO Basement Floor' }
  ] as Camera[]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
