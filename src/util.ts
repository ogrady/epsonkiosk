import * as events from "events";

export function parsePort(v: string | undefined, fallback: number) {
    return v !== undefined && parseInt(v) !== NaN ? parseInt(v as string) : fallback;  
}

export function path(directory: string, file: string): string {
    return (directory.endsWith("/") ? directory : directory + "/") + file;  
}

export enum Severity {
    DEBUG = "DEBUG",
    INFO = "INFO",
    WARNING = "WARNING",
    ERROR = "ERROR"
}

export class Logger extends events.EventEmitter {
    private log(severity: Severity, message: any): void {
        console.log(severity, message);
        this.emit("log", {severity: severity, message: message});
    }

    public debug(message: any): void {
        this.log(Severity.DEBUG, message);
    }

    public info(message: any): void {
        this.log(Severity.INFO, message);
    }

    public warn(message: any): void {
        this.log(Severity.WARNING, message);
    }

    public error(message: any): void {
        this.log(Severity.ERROR, message);
    }
}
