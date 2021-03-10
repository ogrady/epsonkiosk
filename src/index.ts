import { config } from "./config";
import * as ep from "./epson";
import * as ws from "ws";
import * as u from "./util";
const express = require("express");
const app = express();

async function renderIndex(res: any) {
    const available = await epson.isInstalled();
    res.render("index", { 
        title: "Epson Scan Kiosk", 
        message: "Tap to Scan",
        epsonstatus: available ? "Available" : "Unavailable",
        statuscls: available ? "good" : "bad",
        scannerid: "DS-310"
    });    
}

const httpPort: number = u.parsePort(process.env.HTTP_PORT, 8080);
const wsPort: number = u.parsePort(process.env.WS_PORT, 14444);
const epson = new ep.Epson();
const wsServer = new ws.Server({ noServer: true });

app.set("view engine", "pug");

app.use(express.static("rsc"));

app.get( "/", async ( req: any, res: any ) => renderIndex(res));

app.get("/scan", async ( req: any, res: any ) => {
    console.log("info", "received scan request");
    try {
        // fixme: replace hardcoded scanner and settings file
        const result = await epson.scan(new ep.Scanner("DS-310", "ES013E"), new ep.SettingsFile("./Settings.SF2")); // this will be a status code some day...
    } catch(err) {
        // nothing for now, will be printed at callee anyway
    }
    renderIndex(res);
});

app.listen(httpPort, () => {
    console.log( `server started at http://localhost:${ httpPort }` );
});

app.listen(wsPort).on("upgrade", (request: any, socket: any, head: any) => {
    wsServer.handleUpgrade(request, socket, head, (socket: any) => {
        wsServer.emit("connection", socket, request);
        epson.logger.on("log", message => socket.send(JSON.stringify(message)))
    });
});