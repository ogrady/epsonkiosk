# Epson Kiosk
This project serves as a lightweight interface for my [DS-320 document scanner](https://epson.com/Support/Scanners/DS-Series/Epson-DS-320/s/SPT_B11B243201), which I love dearly, but needs to be connected to a computer with `epsonscan2` to function. I had an old laptop wired to it for a while, but I wanted to tidy things up a little. 

My kiosk runs on an old Raspberry Pi 1, which is hooked to an 7 inch touch display, set in a [printed frame](https://www.thingiverse.com/thing:3444545). It is delivered through a webserver running on port 3003. It could therefore also be hosted on a centralised server to which the scanner is connected and only be triggered through the browser of your phone.

The default setting shows a single button to scan to a predefined location, which is read from the default configuration file `Settings.SF2`.

## `epsonscan2`
Epson offers binaries and sources for their scanner tool `epsonscan2` [on their homepage](http://support.epson.net/linux/en/epsonscan2.php). Once installed, a config file can be created running `epsonscan2 -c`. I have mine scan all files to my NAS so I don't need to copy them from my Pi manually. The utility is included in this repository to run as a Docker container.

# Installation

```
docker build -t epsonkiosk . < Dockerfile && docker run --privileged -v /dev/bus/usb:/dev/bus/usb -p 3003:3003 --volume /tmp/:/app/node/scans/ epsonkiosk:latest

```

Would run on port 3003 and scan everything into the host's `/tmp/` directory.