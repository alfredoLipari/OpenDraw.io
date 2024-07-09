# using base image
FROM python:3.12-slim

# setting working dir inside container
WORKDIR /app

# copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of the application
COPY . .

# exposing port 8000 on container
EXPOSE 8000

# serving flask backend through WSGIServer
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000"]
