import * as events from "events";

export function parsePort(v: string | undefined, fallback: number) {
    return v !== undefined && parseInt(v) !== NaN ? parseInt(v as string) : fallback;  
}

export enum Severity {
    DEBUG = "debug",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error"
}

export class Logger extends events.EventEmitter {
    public log(severity: Severity, message: any): void {
        console.log(severity, message);
        this.emit("log", {severity: severity, message: message});
    }
}