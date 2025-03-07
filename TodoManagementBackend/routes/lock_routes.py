from flask import Blueprint, jsonify
from bson import ObjectId
from db_connection import collection
from exception_handler import handle_exceptions

lock_bp = Blueprint('lock_routes', __name__)

@lock_bp.route('/handle_lock_status/<task_id>/<action>', methods=['POST'])
@handle_exceptions
def handle_lock_status(task_id, action):
    result = collection.find_one({'_id': ObjectId(task_id)})
    if result.get('task_locked', 'f') == "t":
        return jsonify({"task_locked": "t"})
    
    if action == "edit":
        collection.update_one({'_id': ObjectId(task_id)}, {"$set": {"task_locked": "t"}})
    
    return jsonify({"task_locked": "f"})

@lock_bp.route('/release_lock/<task_id>', methods=['POST'])
@handle_exceptions
def release_lock(task_id):
    collection.update_one({'_id': ObjectId(task_id)}, {"$set": {"task_locked": "f"}})
    return jsonify({"status": "success"})
