# Virgin Media Hub 5 Python Functions

## Overview

I have two main usecases:
 1. I've put something on my network and I'll be damned if I can remember the IP. One day I'll get around to DNS'ing stuff, but today's not that day, and now I have to log into the Virgin Media Hub 5 router to list all the devices to find the IP... It would be lovely if I could just write up a simple little Python function that would log in and grab that for me. Then if I was feeling ever so special I could even do that on a cronjob and have a static page on my internal site, that would be cool.
 2. My kids are awesome they really are, but sometimes they are really awesome, and sometimes they are not quite so awesome and they need a wee little nudge in the right direction to remind themselves that maybe other people live in this house as well, and sometimes those other people might actually mean the things they are asking them _ever so nicely_ to do... and sometimes I wonder if I had a very simple little HTML switch on a static page on my internal site that I could just flick from `ON` to `OFF` that maybe, oh I don't know, put all their MAC addresses on a block list for internet access, maybe, just _maybe_ they would be able to hear me...

 So, those are quite 'solutioneered', one is a HTML table populated with the devices on my network and the other is a couple of checkboxes to enable or disable blocklist rules (or whatever the VM5 calls them).

 Now the visuals can be whatever, but the underlying functionality needs to do precisely whats written here, so that's what this repo is for, the Python functions that call into the VM5 router and `does this stuff`.

 ## Devving and Setup

 Devving and setting up is easy, the script needs to know two environment variables, `ROUTER_IP` and `ROUTER_PASSWORD`.

 How you do that is entirely up to you, but if you're using VSCode (I am) then you can use the following to help you while playing with the script:

 ```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python Debugger: Current File",
            "type": "debugpy",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal",
            "env": {
                "ROUTER_IP": "=== THE ROUTER'S IP ADDRESS  ===",
                "ROUTER_PASSWORD": "=== THE ROUTER'S PASSWORD ==="
            }
        }
    ]
}
 ```

 *note: in case you didn't notice, you have to supply your own IP and Password in there... ;) I'm sure you did, but just in case...*

 As far as setting environment variables, honestly there's so many ways to do that, and as this _should be_ an OS independant script there's a lot of potential variants. Go google it for your operating system and shell.

 So assuming you've added the `ROUTER_IP` and `ROUTER_PASSWORD` environment variables, you are good to go, just use `python test.py` and it will (probably) run the script.

 Currently what it does is:
  - log into the router
  - get the auth token
  - get the collection of connected devices
  - print the timer on how long it took to do that
  - print the collection of connected devices


## Bonus Detail

I would love to have found a pingable endpoint on the router to list all the available usable URI's on the REST API but I couldn't quickly see one, so I looked through the routers admin pages site itself and snagged the Javascript files, and from those I created a list of all the REST API endpoint URI's I could find. 

These are all in the `/router_js/` directory in this repo.

I've no idea on their signatures (what header args they may or may not require, nor what they might return), but hopefully with the JS files in hand to see how they are used in the site they should be obvious enough.
