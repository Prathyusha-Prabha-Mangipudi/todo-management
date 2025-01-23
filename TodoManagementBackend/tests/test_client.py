import asyncio
import websockets

async def test_websocket():
    uri = "ws://127.0.0.1:5001"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            await websocket.send("Test message")
            response = await websocket.recv()
            print(f"Response from server: {response}")
    except Exception as e:
        print(f"WebSocket connection failed: {e}")

asyncio.run(test_websocket())