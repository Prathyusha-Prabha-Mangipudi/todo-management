import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from routes import task_routes, lock_routes
from socket_manager import handle_socket_events, appsocketio, init_socketio



app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

init_socketio(app)

# Register Blueprints (Routes)
app.register_blueprint(task_routes.task_bp)
app.register_blueprint(lock_routes.lock_bp)

# Setup WebSocket events
handle_socket_events(appsocketio)

@app.route('/')
def home():
    return 'Hello, Flask!'

if __name__ == '__main__':
    appsocketio.run(app, host='127.0.0.1', port=5000, debug=True)
