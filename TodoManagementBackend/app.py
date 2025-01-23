from functools import wraps
import eventlet
import pymongo
eventlet.monkey_patch()

from flask_socketio import SocketIO
from bson import ObjectId
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

connected_clients = 0

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet", transports=["websocket"])

CORS(app, resources={r"/*": {"origins": "*"}})

@socketio.on('connect')
def handle_connect():
    global connected_clients 
    connected_clients += 1
    message = {'type': 'ONLINE_COUNT', 'count': connected_clients}
    socketio.emit('message', message)  
    #print("Client connected " + str(connected_clients))

# Handle WebSocket disconnection
@socketio.on('disconnect')
def handle_disconnect():
    global connected_clients
    connected_clients -= 1
    message = {'type': 'ONLINE_COUNT', 'count': connected_clients}
    socketio.emit('message', message)  
    #print("Client disconnected " + str(connected_clients))

@socketio.on('message')
def handle_message(message):
    print(f"Received message: {message}")

def handle_exceptions(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        try:
            return route_function(*args, **kwargs)
        except pymongo.errors.PyMongoError as e:
            return jsonify({
                'status': 'error',
                'message': f"Database error: {str(e)}"
            }), 500
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f"An unexpected error occurred: {str(e)}"
            }), 500
    return wrapper

# Connect to MongoDB 
client = MongoClient("mongodb://localhost:27017/")  
db = client["taskmgmtdb"]  
collection = db["task_master"]  

@app.route('/')
def home():
    return 'Hello, Flask!'

# Get all saved tasks
'''
@app.route("/get_tasks", methods=["GET"])
def get_tasks():
    task_count = collection.count_documents({})
    print(f"Total tasks in collection: {task_count}")
    tasks = collection.find() 
    task_list = []
    for task in tasks:
        task["_id"] = str(task["_id"])  # Convert ObjectId to string
        task_list.append(task)

    response = jsonify(task_list)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response
    '''

# Get all saved tasks with pagination
'''
@app.route('/tasks', methods=['GET'])
def get_tasks_pagination():
   
    page = request.args.get('page', 1, type=int)
    pageSize = request.args.get('pageSize', 10, type=int)
    skip = (page - 1) * pageSize
    
    tasks_cursor = collection.find().skip(skip).limit(pageSize)
    tasks = [{'_id': str(task['_id']), 'title': task['title'], 'description': task['description'], 
              'status': task['status'], 'priority': task['priority'], 'task_locked' : task['task_locked']} for task in tasks_cursor]
    totalTaskCount = collection.count_documents({})
    
    response = {
        'tasks': tasks,
        'totalTaskCount': totalTaskCount,
        'page': page,
        'pageSize': pageSize
    }
    
    return jsonify(response)
'''

#save task
@app.route('/add_task', methods=['POST'])
@handle_exceptions
def add_task():
    
    body = request.json
    title = body['title']
    description = body['description']
    status = body['status']
    priority = body['priority']
    #sender_sid = body['sid']
    result = collection.insert_one({
        "title": title,
        "description": description,
        "status" : status,
        "priority" : priority,
        "task_locked" : "f"
    })
    message = {'type': 'ADD_TASK'}
    if result.inserted_id:
        socketio.emit('message', message)
    '''
    if result.inserted_id:
    def delayed_emit():
        eventlet.sleep(5)  
        #socketio.emit('message', message, skip_sid=sender_sid)
        socketio.emit('message', message)
        print(f"Emitted ADD_TASK message after delay: {message}")
    socketio.start_background_task(delayed_emit)
    '''

    return jsonify({
        'status': 'success',
        'message': 'Task saved successfully!'
    })


#edit task
@app.route('/edit_task', methods=['POST'])
@handle_exceptions
def edit_task():
    
    body = request.json
    title = body['title']
    description = body['description']
    status = body['status']
    priority = body['priority']
    id = body['_id']
    collection.update_one(
            {'_id': ObjectId(id)},
            {
                "$set": {
                    "title":title,
                    "description":description,
                    "status" : status,
                    "priority" : priority,
                    "task_locked" : "f"
                }
            }
        )
    message = {'type': 'EDIT_TASK', '_id': id}
    socketio.emit('message', message)  
    print(f"Emitted EDIT_TASK message: {message}")
    return jsonify({
        'status': 'success',
        'message': 'Task edited successfully!'
    })


# Delete a task
@app.route('/delete_task/<task_id>', methods=['DELETE'])
@handle_exceptions
def delete_task(task_id):
    
    result = collection.delete_one({'_id': ObjectId(task_id)})
    if result.deleted_count > 0:
        message = {'type': 'DELETE_TASK', '_id': task_id}
        socketio.emit('message', message)  
        print(f"Emitted DELETE_TASK message: {message}") 
        return jsonify({
            'status': 'success',
            'message': 'Task deleted successfully!'
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Unable to delete task'
        })


# Search by task title
@app.route("/search_tasks", methods=["GET"])
@handle_exceptions
def search_tasks():
    
    page = request.args.get('page', 1, type=int)
    pageSize = request.args.get('pageSize', 10, type=int)
    skip = (page - 1) * pageSize
    status = request.args.get('status', None)
    priority = request.args.get('priority', None)
    title = request.args.get('title', None)

    filters = []
    if status:
        filters.append({"status": status})
    if priority:
        filters.append({"priority": priority})
    if title:
        filters.append({"title": {"$regex": title, "$options": "i"}})

    query = {"$and": filters} if filters else {}

    tasks_cursor = collection.find(query).skip(skip).limit(pageSize)
    tasks = [{'_id': str(task['_id']), 'title': task['title'], 'description': task['description'],
            'status': task['status'], 'priority': task['priority'], 'task_locked': task['task_locked']} for task in tasks_cursor]
    totalTaskCount = collection.count_documents(query)

    response = {
        "tasks": tasks,
        "totalTaskCount": totalTaskCount,
        "page": page,
        "pageSize": pageSize
    }
    

    return jsonify(response)

# Fetch task locked status
@app.route('/handle_lock_status/<task_id>/<action>', methods=['POST'])
@handle_exceptions
def handle_lock_status(task_id, action):
    
    result = collection.find_one({'_id': ObjectId(task_id)})
    if result.get('task_locked', 'f') == "t":
        response = {
            "task_locked": "t"
        }
    else:
        # Lock the task
        if(action == "edit"):
            collection.update_one(
                {'_id': ObjectId(task_id)},
                {"$set": {"task_locked": "t"}}
            )
        response = {
            "task_locked": "f"
        }
   
    return jsonify(response)

# Fetch task locked status
@app.route('/release_lock/<task_id>', methods=['POST'])
@handle_exceptions
def release_lock(task_id):
    
    collection.update_one(
        {'_id': ObjectId(task_id)},
        {"$set": {"task_locked": "f"}}
    )
    response = {
        "status": "success"
    }
    
    return jsonify(response)

if __name__ == '__main__':
     socketio.run(app, host='127.0.0.1', port=5000, debug=True)
    #app.run(debug=True)