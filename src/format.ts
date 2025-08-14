
import {IS_BROWSER} from './util.js';


let nodeReadFile: typeof import('node:fs/promises').readFile | null = null;
if (IS_BROWSER) {
    nodeReadFile = (await import('node:fs/promises')).readFile;
}


export class Table {

    path: string;
    data: string | null = null;

    constructor(path: string) {
        this.path = path;
    }

    async load(): Promise<void> {
        if (IS_BROWSER) {
        let path = 'data/objects/' + this.path;
            let resp = await fetch(path);
            if (!resp.ok) {
                throw new Error(`${resp.status} ${resp.statusText} while fetching ${path}`);
            }
        } else {
            let path = import.meta.dirname + '/../data/objects' + this.path;
            // @ts-ignore
            this.data = (await nodeReadFile(path)).toString();
        }
    }

}
