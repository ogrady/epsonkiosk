import { config } from "./config";
import * as ep from "./epson";
import * as ws from "ws";
import * as u from "./util";
const express = require("express");

// configuration
const debug = true;
const configDirectory = "./config";
const defaultConfig = "Default.SF2";
const httpPort: number = u.parsePort(process.env.HTTP_PORT, 8080);
const wsPort: number = u.parsePort(process.env.WS_PORT, 14444);

const httpApp = express();
const wsApp = express();

const logger = new u.Logger();
const epson = new ep.Epson(logger);
const wss = new ws.Server({ noServer: true });

async function renderIndex(res: any) {
    const available = await epson.isInstalled();
    res.render("index", { 
        title: "Epson Scan Kiosk", 
        message: "Tap to Scan",
        epsonstatus: available ? "Available" : "Unavailable",
        statuscls: available ? "good" : "bad",
        //scannerid: "DS-310",
        scanners: (await epson.getScanners())?.map(scanner => scanner.id) || (debug ? [new ep.Scanner("DS-310", "ES013E")] : []),
        configs: ep.findConfigFiles(configDirectory).map(config => config.name)
    });    
}



logger.on("log", message => Array.from(wss.clients).map(client => client.send(JSON.stringify(message))));

httpApp.set("view engine", "pug");
httpApp.set("views", "rsc/views");


httpApp.use(express.static("rsc"));

httpApp.use(express.json()); 

httpApp.get( "/", async ( req: any, res: any ) => renderIndex(res));

httpApp.post("/scan", async ( req: any, res: any ) => {
    try {
        const settingsFile: string = u.path(configDirectory, ep.findConfigFiles(configDirectory).find(config => config.name === req.body.configuration)?.name || defaultConfig);
        const scanner: ep.Scanner | undefined = (await epson.getScanners())?.find(scanner => scanner.id === req.body.scanner);
        if(scanner === undefined) {
            logger.error(`no scanner with ID "${req.body.scanner}" detected. Canceling scan.`);
        } else {
            await epson.scan(scanner, new ep.SettingsFile(settingsFile));
        }       
    } catch(err) {
        // nothing for now, will be printed at callee anyway
    }
    renderIndex(res);
});

httpApp.listen(httpPort, () => {
    logger.info(`server started at http://localhost:${ httpPort }`);
});

wsApp.listen(wsPort).on("upgrade", (request: any, socket: any, head: any) => 
    wss.handleUpgrade(request, socket, head, (socket: any) => 
        wss.emit("connection", socket, request)));
