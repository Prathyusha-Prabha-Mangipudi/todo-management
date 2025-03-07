from pymongo import MongoClient
import dbconfig

client = MongoClient(dbconfig.MONGO_URI)
db = client[dbconfig.DB_NAME]
collection = db[dbconfig.COLLECTION_NAME]