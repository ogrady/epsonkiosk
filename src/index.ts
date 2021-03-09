import { config } from "./config";
import * as ep from "./epson";
const express = require("express");
const app = express();

const port: number = process.env.PORT !== undefined && parseInt(process.env.PORT) !== NaN 
                        ? parseInt(process.env.PORT as string) 
                        : 8080;

const epson = new ep.Epson();

app.set("view engine", "pug");
app.use(express.static("rsc"));

console.log(process.env);

async function renderIndex(res: any) {
    const available = await epson.isInstalled();
    res.render("index", { 
        title: "Epson Scan Kiosk", 
        message: "Tap to Scan",
        epsonstatus: available ? "Available" : "Unavailable",
        statuscls: available ? "good" : "bad"
    });    
}

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

app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
});
