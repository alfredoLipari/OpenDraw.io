from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return "My Addition App", 200

@app.route('/health')
def health():
    return '', 200

@app.route('/ready')
def ready():
    return '', 200