import { debug } from 'debug';
export const tkDebug = (componentName) => {
    return debug(`tk.external/${componentName}`);
};
