import os
import requests
import asyncio
import time
from requests.auth import HTTPBasicAuth 

async def sleep(start):
    print(f'Time taken: {time.time() - start:.2f}')
    await asyncio.sleep(1)

def logout():
    return(requests.get("http://192.168.0.1/rest/v1/user/login"))

def login(password):
    basic_api_req = requests.post("http://192.168.0.1/rest/v1/user/login", json={"password": password})
    auth_token = ""
    try:
        auth_token = basic_api_req.json()['created']['token']
    except KeyError as err:
        print("unable to get token: {err}")
    return auth_token

def get_connected_devices(token: str):
    connected_devices = None
    start = time.time()
    loop = asyncio.get_event_loop()
    tasks = [
        sleep(start),
        loop.create_task(async_get_connected_devices(auth_token))
    ]
    print("Please wait, collecting devices...")
    timer, connected_devices_response = loop.run_until_complete(asyncio.gather(*tasks))
    loop.close()
    connected_devices = connected_devices_response.json()
    return connected_devices

async def async_get_connected_devices(token: str):
    return(requests.get("http://192.168.0.1/rest/v1/network/hosts?connectedOnly=true", headers={"Authorization": f"Bearer {auth_token}"}))

if __name__ == '__main__':
    password = os.environ['ROUTER_PASSWORD']
    if password:
        auth_token = login(password)
        connected_devices = get_connected_devices(auth_token)
        print(connected_devices)
        logout_response = logout()