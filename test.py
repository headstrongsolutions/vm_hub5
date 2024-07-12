import os
import requests
import asyncio
import time
from requests.auth import HTTPBasicAuth 

async def sleep(start: time):
    """ Prints out how long the overall asyncio tasks took 
        Args: start [time] - starting time for the counter 
    """
    print(f'Time taken: {time.time() - start:.2f}')
    await asyncio.sleep(1)

def logout(router_ip: str) -> requests.Response:
    """ Logs out of the Router
        Uses the standard login URI, without any auth credentials
        Args: router_ip[str] - the IP of the router
        Returns: Response object
    """
    return(requests.get(f"http://{router_ip}/rest/v1/user/login"))

def login(router_ip: str, router_password: str) -> str:
    """ Logs into the Router, then collects and returns the auth_token
        Args: router_ip[str] - the IP of the router,
              password[str] - router users password (for user ID 3)
        Returns: auth_token[str] - authorisation bearer token
    """
    basic_api_req = requests.post(f"http://{router_ip}/rest/v1/user/login", json={"password": router_password})
    auth_token = ""
    try:
        auth_token = basic_api_req.json()['created']['token']
    except KeyError as err:
        print("unable to get token: {err}")
    return auth_token

def get_connected_devices(router_ip, auth_token: str) -> list:
    """ Gets a json collection of all the devices connected to the router 
        Args: router_ip[str] - the IP of the router,
              auth_token[str] - authorisation bearer token
        Returns: connected_devices[json] - json object of all connected devices
    """
    connected_devices = None
    start = time.time()
    loop = asyncio.get_event_loop()
    tasks = [
        sleep(start),
        loop.create_task(async_get_connected_devices(router_ip, auth_token))
    ]
    print("Please wait, collecting devices...")
    timer, connected_devices_response = loop.run_until_complete(asyncio.gather(*tasks))
    loop.close()
    connected_devices = connected_devices_response.json()
    return connected_devices

async def async_get_connected_devices(router_ip: str, auth_token: str) -> requests.Response:
    """ Asyncronousely gets a json collection of all the devices connected to the router 
        Args: router_ip[str] - the IP of the router,
              auth_token[str] - authorisation bearer token
        Returns: requests.Response object - response object of all connected devices
    """
    return(requests.get(f"http://{router_ip}/rest/v1/network/hosts?connectedOnly=true", headers={"Authorization": f"Bearer {auth_token}"}))

if __name__ == '__main__':
    router_ip = os.environ['ROUTER_IP']
    router_password = os.environ['ROUTER_PASSWORD']
    if router_password:
        auth_token = login(router_ip, router_password)
        connected_devices = get_connected_devices(router_ip, auth_token)
        print(connected_devices)
        logout_response = logout(router_ip)