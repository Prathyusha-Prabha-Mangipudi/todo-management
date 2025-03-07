from flask_socketio import SocketIO

connected_clients = 0

appsocketio = SocketIO(cors_allowed_origins="*", async_mode="eventlet", transports=["websocket"])

def handle_socket_events(socketio: SocketIO):
    @socketio.on('connect')
    def handle_connect():
        global connected_clients
        connected_clients += 1
        socketio.emit('message', {'type': 'ONLINE_COUNT', 'count': connected_clients})

    @socketio.on('disconnect')
    def handle_disconnect():
        global connected_clients
        connected_clients -= 1
        socketio.emit('message', {'type': 'ONLINE_COUNT', 'count': connected_clients})

    @socketio.on('message')
    def handle_message(message):
        print(f"Received message: {message}")

def init_socketio(app):
    appsocketio.init_app(app)
