import unittest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app
from flask import json
import mongomock

mock_db = mongomock.MongoClient().db
mock_collection = mock_db["task_master"]

class FlaskAppTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app.test_client()
        cls.app.testing = True
        app.db = mock_db
        app.collection = mock_collection

    def setUp(self):
        mock_collection.delete_many({}) 

    def test_home(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.decode('utf-8'), 'Hello, Flask!')

    def test_add_task(self):
        task_data = {
            "title": "Test Task",
            "description": "This is a test task.",
            "status": "In-Progress",
            "priority": "High"
        }
        response = self.app.post('/add_task', data=json.dumps(task_data), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'success')
        self.assertEqual(response.json['message'], 'Task saved successfully!')

    def test_edit_task(self):
        mock_task = mock_collection.insert_one({
            "title": "Old Task",
            "description": "Old description",
            "status": "In-Progress",
            "priority": "Low",
            "task_locked": "f"
        })

        task_id = str(mock_task.inserted_id)
        edit_data = {
            "_id": task_id,
            "title": "Updated Task",
            "description": "Updated description",
            "status": "Completed",
            "priority": "High"
        }
        response = self.app.post('/edit_task', data=json.dumps(edit_data), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'success')
        self.assertEqual(response.json['message'], 'Task edited successfully!')

    def test_delete_task(self):
        mock_task = mock_collection.insert_one({
            "title": "Test Delete task",
            "description": "Task should be deleted.",
            "status": "In-Progress",
            "priority": "High",
            "task_locked": "f"
        })

        task_id = str(mock_task.inserted_id)
        print(f"Mock task_id: {task_id}")
        print(f"Database contents: {list(mock_collection.find())}")
        response = self.app.delete(f'/delete_task/{task_id}')
        print("Response data:", response.json)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'success')
        self.assertEqual(response.json['message'], 'Task deleted successfully!')

    def test_search_tasks(self):
        mock_collection.insert_many([
            {"title": "Test Task 1", "description": "Desc 1", "status": "In-Progress", "priority": "High", "task_locked": "f"},
            {"title": "Test Task 2", "description": "Desc 2", "status": "Completed", "priority": "Low", "task_locked": "f"}
        ])

        response = self.app.get('/search_tasks?title=Test&page=1&pageSize=10')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json['totalTaskCount'], 2)
        self.assertEqual(len(response.json['tasks']), 2)

    def test_handle_lock_status(self):
        mock_task = mock_collection.insert_one({
            "title": "Lockable Task",
            "description": "Task with lock.",
            "status": "In-Progress",
            "priority": "Medium",
            "task_locked": "f"
        })

        task_id = str(mock_task.inserted_id)
        response = self.app.post(f'/handle_lock_status/{task_id}/edit')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['task_locked'], 'f')

    def test_release_lock(self):
        mock_task = mock_collection.insert_one({
            "title": "Locked Task",
            "description": "Task with lock.",
            "status": "In-Progress",
            "priority": "Medium",
            "task_locked": "t"
        })

        task_id = str(mock_task.inserted_id)
        response = self.app.post(f'/release_lock/{task_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'success')

if __name__ == '__main__':
    unittest.main()
