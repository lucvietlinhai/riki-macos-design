import type { Character } from '../types';
import { rikimoFaceBase64 } from './rikimo/face';
import { rikimoBodyBase64 } from './rikimo/body';
import { hankimoFaceBase64 } from './hankimo/face';
import { hankimoBodyBase64 } from './hankimo/body';
import { rikimiFaceBase64 } from './rikimi/face';
import { rikimiBodyBase64 } from './rikimi/body';

export const characters: Character[] = [
  {
    id: 'rikimo',
    name: 'Rikimo',
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