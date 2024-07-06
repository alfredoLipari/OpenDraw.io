from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)

client = MongoClient('mongodb://mongo-service:27017/')
db = client['opendraw']
collection = db['items']

@app.route('/')
def index():
    return "Welcome to opendraw!", 200

@app.route('/health')
def health():
    return '', 200

@app.route('/ready')
def ready():
    return '', 200

@app.route('/items', methods=['GET'])
def get_items():
    items = collection.find()
    return jsonify([{'_id': str(item['_id']), 'name': item['name']} for item in items]), 200

@app.route('/items', methods=['POST'])
def add_item():
    data = request.json
    item = collection.insert_one(data)
    return jsonify({'_id': str(item.inserted_id)}), 201