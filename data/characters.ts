import type { Character } from '../types';
import { rikimoFaceBase64 } from './rikimo/face';
import { rikimoBodyBase64 } from './rikimo/body';
import { hankimoFaceBase64 } from './hankimo/face';
import { hankimoBodyBase64 } from './hankimo/body';
import { rikimiFaceBase64 } from './rikimi/face';
import { rikimiBodyBase64 } from './rikimi/body';

import rikimoNewFace from './rikimo-new/face.png';
import rikimoNewBody from './rikimo-new/body.png';
import rikimoNewTurnaround from './rikimo-new/turnaround.png';
import rikimoNewExpression from './rikimo-new/expression.png';
import rikimoNewPose from './rikimo-new/pose.png';

export const characters: Character[] = [
  {
    id: 'rikimo-new',
    name: 'Rikimo New',
    face: rikimoNewFace,
    body: rikimoNewBody,
    turnaroundSheet: rikimoNewTurnaround,
    expressionSheet: rikimoNewExpression,
    poseSheet: rikimoNewPose
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