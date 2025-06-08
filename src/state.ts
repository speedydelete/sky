
import {query, Vector3} from './util.js';


export let width = window.innerWidth;
export let height = window.innerHeight;

export let cRa = 0;
export let cDec = 0;

export let target = new Vector3();
export let targetName = 'Earth';


export let canvas = query<HTMLCanvasElement>('canvas');
