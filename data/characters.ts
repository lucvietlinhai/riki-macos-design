import type { Character } from '../types';
import { rikimoFaceBase64 } from './rikimo/face';
import { rikimoBodyBase64 } from './rikimo/body';
import { hankimoFaceBase64 } from './hankimo/face';
import { hankimoBodyBase64 } from './hankimo/body';
import { rikimiFaceBase64 } from './rikimi/face';
import { rikimiBodyBase64 } from './rikimi/body';

export const characters: Character[] = [
  {
    id: 'rikimo-new',
    name: 'Rikimo New',
    face: '/characters/rikimo-new/face.png',
    body: '/characters/rikimo-new/body.png',
    turnaroundSheet: '/characters/rikimo-new/turnaround.png',
    expressionSheet: '/characters/rikimo-new/expression.png',
    poseSheet: '/characters/rikimo-new/pose.png'
  },
  {
    id: 'rikimo',
    name: 'Rikimo Classic',
    face: rikimoFaceBase64,
    body: rikimoBodyBase64,
  },
  {
    id: 'hankimo',
    name: 'Hankimo',
    face: hankimoFaceBase64,
    body: hankimoBodyBase64,
  },
  {
    id: 'rikimi',
    name: 'Rikimi',
    face: rikimiFaceBase64,
    body: rikimiBodyBase64,
  }
];