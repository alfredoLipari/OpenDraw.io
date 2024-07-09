from gevent.pywsgi import WSGIServer
from backend.main import app

http_server = WSGIServer(('0.0.0.0', 8000), app)
http_server.serve_forever()