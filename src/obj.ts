
import {LY_TO_PARSEC, H0, C, Coords, Vector3, J2000} from './util.js';


export type DeepObjType = 'star';
export type ShallowObjType = 'mp' | 'moon';
export type ObjType = 'special' | DeepObjType | ShallowObjType;


export abstract class BaseObj {
    
    abstract type: ObjType;

    name?: string;
    notes?: string;
    internalNotes?: string;

    abstract getCoords(time: number): Coords;
    
    getXYZ(time: number): Vector3 {
        return Coords.prototype.toVector3.call(this.getCoords(time));
    }

}


export abstract class DeepObj extends BaseObj {

    abstract type: DeepObjType;

    ra: number;
    dec: number;
    pmra: number | null = null;
    pmdec: number | null = null;
    rvz: number | null = null;
    dist: number | null = null;
    plx: number | null = null;
    z: number | null = null;

    constructor(ra: number, dec: number) {
        super();
        this.ra = ra;
        this.dec = dec;
    }

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

    getCoords(time: number): Coords {
        return new Coords(
            this.ra + (time - J2000) * (this.pmra ? this.pmra / 3600000 : 0),
            this.dec + (time - J2000) * (this.pmdec ? this.pmdec / 3600000 : 0),
            this.dist === null ? null : this.dist + (time - J2000) * (this.rvz ? this.rvz / (C / 1000) : 0),
        );
    }

}


export class Star extends DeepObj {

    type: 'star' = 'star';

}
