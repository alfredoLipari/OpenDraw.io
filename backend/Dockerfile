# using base image
FROM python:3.12-slim

# setting working dir inside container
WORKDIR /python-flask-app

# copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# copy the rest of the application
COPY . .

# exposing port 8000 on container
EXPOSE 8000

# serving flask backend through WSGIServer
CMD [ "python", "run.py" ]
