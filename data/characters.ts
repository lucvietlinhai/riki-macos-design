import type { Character } from '../types';
import { rikimoFaceBase64 } from './rikimo/face';
import { rikimoBodyBase64 } from './rikimo/body';
import { hankimoFaceBase64 } from './hankimo/face';
import { hankimoBodyBase64 } from './hankimo/body';
import { rikimiFaceBase64 } from './rikimi/face';
import { rikimiBodyBase64 } from './rikimi/body';
import { rikimoNewFaceBase64 } from './rikimo-new/face';
import { rikimoNewBodyBase64 } from './rikimo-new/body';
import { rikimoNewTurnaroundBase64 } from './rikimo-new/turnaround';
import { rikimoNewExpressionBase64 } from './rikimo-new/expression';
import { rikimoNewPoseBase64 } from './rikimo-new/pose';

export const characters: Character[] = [
  {
    id: 'rikimo-new',
    name: 'Rikimo New',
    face: rikimoNewFaceBase64,
    body: rikimoNewBodyBase64,
    turnaroundSheet: rikimoNewTurnaroundBase64,
    expressionSheet: rikimoNewExpressionBase64,
    poseSheet: rikimoNewPoseBase64
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