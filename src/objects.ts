
import {Color} from './util.js';


export interface Obj {
    id: number;
    name: string;
    type: string;
    ra: number;
    dec: number;
    pmRa: number;
    pmDec: number;
    rvel: number;
    dist: number;
    mag: number;
    color: Color;
}
