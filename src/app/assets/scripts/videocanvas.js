/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */

function streamCam() {
  const client = 'wss://it.center-inform.ru:9999';
  const canvas = document.getElementById('main-camera');
  const player = new JSMpeg.Player(client, {
    canvas,
    audio: false,
  });
  return player;
}
function streamCamBack() {
  const client = 'wss://it.center-inform.ru:9996';
  const canvas = document.getElementById('back-camera');
  const player = new JSMpeg.Player(client, {
    canvas,
    audio: false,
  });
  return player;
}
function streamCamRoom1() {
  const client = 'wss://it.center-inform.ru:9997';
  const canvas = document.getElementById('server-room-1');
  const player = new JSMpeg.Player(client, {
    canvas,
    audio: false,
  });
  return player;
}

function streamCamRoom2() {
  const client = 'wss://it.center-inform.ru:9998';
  const canvas = document.getElementById('server-room-2');
  const player = new JSMpeg.Player(client, {
    canvas,
    audio: false,
  });
  return player;
}
