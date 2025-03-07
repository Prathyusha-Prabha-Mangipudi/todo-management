from flask import Blueprint, request, jsonify
from bson import ObjectId
from socket_manager import appsocketio
from db_connection import collection
from exception_handler import handle_exceptions

task_bp = Blueprint('task_routes', __name__)

@task_bp.route('/add_task', methods=['POST'])
@handle_exceptions
def add_task():
    body = request.json
    result = collection.insert_one({
        "title": body['title'],
        "description": body['description'],
        "status": body['status'],
        "priority": body['priority'],
        "task_locked": "f"
    })

    if result.inserted_id:
        appsocketio.emit('message', {'type': 'ADD_TASK'})

    return jsonify({'status': 'success', 'message': 'Task saved successfully!'})

@task_bp.route('/edit_task', methods=['POST'])
@handle_exceptions
def edit_task():
    body = request.json
    collection.update_one({'_id': ObjectId(body['_id'])}, {"$set": body})
    
    appsocketio.emit('message', {'type': 'EDIT_TASK', '_id': body['_id']})
    return jsonify({'status': 'success', 'message': 'Task edited successfully!'})

@task_bp.route('/delete_task/<task_id>', methods=['DELETE'])
@handle_exceptions
def delete_task(task_id):
    result = collection.delete_one({'_id': ObjectId(task_id)})
    
    if result.deleted_count > 0:
        appsocketio.emit('message', {'type': 'DELETE_TASK', '_id': task_id})
        return jsonify({'status': 'success', 'message': 'Task deleted successfully!'})
    
    return jsonify({'status': 'error', 'message': 'Unable to delete task'})

# Search by task title
@task_bp.route('/search_tasks', methods=['GET'])
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
