import fs from "fs";
import NodeCache from "node-cache";

export const proxyWrite = (object: any, path: string) =>
  new Proxy(object, {
    get: (target, prop) => target[prop],
    set: (target, prop, value) => {
      // eslint-disable-next-line no-param-reassign
      target[prop] = value;
      try {
        fs.writeFileSync(path, JSON.stringify(target, null, 2), "utf-8");
      } catch (error) {
        // handle error
      }
      return true;
    },
  }).valueOf();

export const cache = new NodeCache({ useClones: false });
