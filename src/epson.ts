import { exec } from "child_process";
import * as fs from "fs";
import * as u from "./util";

/**
* Errors codes natice to epsonscan2
*/
enum EpsonECodes {
    NO_ERROR = 0,
    NO_INPUT_PAPER = 14, // "load the originals in the ADF"
    NO_DISPLAY_DETECTED = 134, // fine in headless mode   
    UNABLE_TO_SAVE = 102, // no, really, I have no idea what this is
}

/**
* Error codes for the wrapper.
*/ 
enum ECodes {
    NO_ERROR = 0,
    NOT_INSTALLED = 1,
    GENERIC_ERROR = 2
} 

/**
* Named tuple for a scanner as produced by epsonscan2 -l
*/
export class Scanner {
    readonly id: string;
    readonly model: string;

    public constructor(id: string, model: string) {
        this.id = id;
        this.model = model;
    }
}

/**
* .SF2 file as required by epsonscan2; a default can be acquired using epsonscan2 -c
*/ 
export class SettingsFile {
    readonly path: string;

    public constructor(path: string) {
        this.path = path;
    }
}

const NOT_FOUND = "Device is not found...";
const HEADER = "=== List of available devices ==";
// whitelist for error codes when checking whether epsonscan2 is installed
const INSTALLED_WHITELIST = [
    EpsonECodes.NO_ERROR, EpsonECodes.NO_DISPLAY_DETECTED
];

// whitelist for error codes when starting a scan
const SCAN_WHITELIST = [
    EpsonECodes.UNABLE_TO_SAVE
];

/**
* Finds all .SF2 files in a given directory (non-recursive)
* @param directory absolute or relative path to where the configs are 
* @returns list of objects, each holding the filename and the full path to the file
*/
export const findConfigFiles = (directory: string): {name: string, path: string}[] =>
    fs.readdirSync(directory)
      .filter(file => file.endsWith(".SF2"))
      .map(file => { return { name: file, path: u.path(directory, file)}; } )
;

/**
* Wrapper around epsonscan2
*/
export class Epson {
    private installed: boolean | undefined;
    readonly logger: u.Logger;

    public constructor(logger: u.Logger | undefined = undefined) {
        this.logger = logger || new u.Logger();
    }

    /**
    * Checks whether the epsonscan2 utility is installed and available
    * Result will be cached after the first call
    * @returns true, iff the epsonscan2 utility is installed. That includes erroring out with one of the accepted errors in INSTALLED_WHITELIST
    */
    public async isInstalled(): Promise<boolean> {
        if(this.installed === undefined) {
            this.installed = await new Promise<boolean>((resolve, reject) => 
                                        exec("epsonscan2")
                                        .on("error", error => { this.logger.error(`An error occurred while trying to execute epsonscan2: ${error}`); resolve(false); })
                                        .on("close", code => resolve(code !== null && INSTALLED_WHITELIST.includes(code)) ));
            this.logger.debug(`Epson installation detected: ${this.installed}`);
        }
        return this.installed;
    }

    /**
    * Starts a scan
    * @param scanner the scanner to start the scan from
    * @param settingsFile the settings file to use for the scan
    * @returns a status code
    */
    public async scan(scanner: Scanner, settingsFile: SettingsFile): Promise<number> {
        this.logger.info(`scan request received, attempting to use settings file ${settingsFile.path}`);
        return (await this.isInstalled())
                ? new Promise<number>((resolve, reject) => 
                    exec(`epsonscan2 -s ${scanner.id} ${settingsFile.path}`, {}, (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
                        if(stdout) {
                            this.logger.info(stdout);
                        }

                        if (error || stderr || !stdout) {
                            this.logger.error(error || stderr || "no output received");
                            reject(ECodes.GENERIC_ERROR);
                        } else {
                            resolve(ECodes.NO_ERROR);                           
                        }
                    })
                    .on("message", (message, handle) => this.logger.error(message))
                )
                : Promise.resolve(ECodes.NOT_INSTALLED);
    }

    /**
    * Produces a list of installed and available scanners based on the output of epsonscan2 -l
    * @returns list of installed and available scanners
    */
    public async getScanners(): Promise<Scanner[] | undefined> {
        return (await this.isInstalled()) 
                ? new Promise<Scanner[]>((resolve, reject) => 
                    exec("epsonscan2 -l", {}, (error: Error | null, stdout: string | Buffer, stderr: string | Buffer) => {
                        if (error || stderr || !stdout) {
                            reject(error || stderr || "no output received");
                        } else {
                            const stdoutstr: string = (stdout instanceof Buffer) 
                                                        ? stdout.toString("utf-8")
                                                        : stdout as string;
                            const lines = stdoutstr.trim().split("\n");
                            if(lines[0] === NOT_FOUND) {
                                resolve([]);
                            } else if(lines[0] === HEADER) {
                                lines.shift(); // remove header
                                resolve(this.parseScanners(lines));
                            } else {
                                // error?
                            }
                            
                        }
                    })
                )
            : undefined
    }

    /**
    * Parses one scanner from the output of epsonscan2 -l, which is expected to be in format:
    *   device ID:XX-YYY
    *   ModelID:ZZZZZZ
    * @param lines remaining input from epsonscan2 -l, which will be modified by reference
    * @returns a Scanner parsed from the input
    */
    private parseScanners(lines: string[]): Scanner[] {
        const scanners: Scanner[] = [];
        while(lines.length > 0) {
            const idStr = lines.shift();
            const modelStr = lines.shift();
            const id = idStr?.match(/device ID :(.*)/);
            const model = modelStr?.match(/ModelID:(.*)/);

            if(!id || !model) {
                throw new Error(`either ID '${idStr}' or model '${modelStr}' of scanner are invalid.`);
            }

            const scanner = new Scanner(id[1], model[1])
            this.logger.debug(`parsed scanner ${scanner.id}`)
            scanners.push(scanner);
        }       
        return scanners;
    }
}
