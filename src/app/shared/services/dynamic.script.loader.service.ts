import { Injectable } from '@angular/core';

interface IScripts {
  name: string;
  src: string;
}

export const scriptStore: IScripts[] = [
  { name: 'jsmpeg', src: './assets/scripts/jsmpeg.min.js' },
  { name: 'videocanvas', src: './assets/scripts/videocanvas.js' },
];

declare let document: any;

@Injectable({
  providedIn: 'root',
})
export class DynamicScriptLoaderService {
  private scripts: any = {};

  constructor() {
    scriptStore.forEach((script: any) => {
      this.scripts[script.name] = {
        loaded: false,
        src: script.src,
      };
    });
  }

  public load(...scripts: string[]) {
    const promises: any[] = [];
    scripts.forEach(script => promises.push(this.loadScript(script)));
    return Promise.all(promises);
  }

  private loadScript(name: string) {
    return new Promise((resolve, reject) => {
      if (!this.scripts[name].loaded) {
        // load script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = this.scripts[name].src;
        if (script.readyState) {
          // IE
          script.onreadystatechange = () => {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
              script.onreadystatechange = null;
              this.scripts[name].loaded = true;
              resolve({ script: name, loaded: true, status: 'Loaded' });
            }
          };
        } else {
          // Others
          script.onload = () => {
            this.scripts[name].loaded = true;
            resolve({ script: name, loaded: true, status: 'Loaded' });
          };
        }
        script.onerror = (error: any) => resolve({ script: name, loaded: false, status: 'Loaded' });
        document.getElementsByTagName('head')[0].appendChild(script);
      } else {
        resolve({ script: name, loaded: true, status: 'Already Loaded' });
      }
    });
  }
}
