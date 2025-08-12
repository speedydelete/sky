
export type DeepObjType = 'star';
export type ShallowObjType = 'mp' | 'moon';
export type ObjType = 'special' | DeepObjType | ShallowObjType;


export abstract class BaseObj {
    
    abstract type: ObjType;

    abstract getCoords(time: number): {ra: number, dec: number, dist: number};
    abstract getXYZ(time: number): [number, number, number];

}


export abstract class DeepObj extends BaseObj {

    abstract type: DeepObjType;

}
