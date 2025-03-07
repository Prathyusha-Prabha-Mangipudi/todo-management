from functools import wraps
from flask import jsonify
import pymongo

def handle_exceptions(route_function):
    @wraps(route_function)
    def wrapper(*args, **kwargs):
        try:
            return route_function(*args, **kwargs)
        except pymongo.errors.PyMongoError as e:
            return jsonify({'status': 'error', 'message': f"Database error: {str(e)}"}), 500
        except Exception as e:
            return jsonify({'status': 'error', 'message': f"An unexpected error occurred: {str(e)}"}), 500
    return wrapper
