
import {LY_TO_PARSEC, H0, C, CoordsLike, Vector3Like} from './util.js';


export type DeepObjType = 'star';
export type ShallowObjType = 'mp' | 'moon';
export type ObjType = 'special' | DeepObjType | ShallowObjType;


export abstract class BaseObj {
    
    abstract type: ObjType;

    name?: string;
    notes?: string;
    internalNotes?: string;

    abstract getCoords(time: number): CoordsLike;
    abstract getXYZ(time: number): Vector3Like;

}


export abstract class DeepObj extends BaseObj {

    abstract type: DeepObjType;

    ra: number | null = null;
    dec: number | null = null;
    pmra: number | null = null;
    pmdec: number | null = null;
    rvz: number | null = null;
    dist: number | null = null;
    plx: number | null = null;
    z: number | null = null;

    initDistanceValues() {
        if (this.dist !== null) {
            let parsecs = this.dist / LY_TO_PARSEC;
            this.plx = 1 / parsecs;
            this.z = H0 * parsecs / C;
        } else if (this.plx !== null) {
            let parsecs = 1 / this.plx;
            this.dist = parsecs / LY_TO_PARSEC;
            this.z = H0 * parsecs / C;
        } else if (this.z !== null) {
            this.dist = this.z * C / H0;
            this.plx = 1 / (this.dist / LY_TO_PARSEC);
        }
    }

    getCoords(time: number): CoordsLike {

    }

    getXYZ(time: number): Vector3Like {

    }

}


export class Star extends DeepObj {

    type: 'star' = 'star';

}
