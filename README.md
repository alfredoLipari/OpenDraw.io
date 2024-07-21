
OpenDraw Web Application
========================

Overview
--------

OpenDraw is an online web game that challenges users to draw random objects and lets a bot guess their drawings. The application uses the FARM stack (FastAPI, React, MongoDB) and is deployed on Google Kubernetes Engine (GKE).

Project Objectives
------------------

-   Gain a comprehensive understanding of Kubernetes.
-   Learn how applications can be automatically scaled.
-   Implement and analyze a full-stack application's performance under scalable conditions.

Infrastructure
--------------

-   **Frontend:** React + Vite
-   **Web Server:** NGINX
-   **Backend:** FastAPI
-   **Database:** MongoDB
-   **Container Orchestration:** Kubernetes on GKE

DevOps Tools
------------

-   MongoDB Compass
-   GitHub and GitHub Actions for CI/CD
-   Apache JMeter for load testing

Deployment Journey
------------------

### Develop the React + Vite Frontend Website

Core libraries used:

-   Chakra UI
-   Axios
-   React Router
-   useContext and useReducer for state management

#### Screen Pages

-   **Start Page:** User registration and login.
-   **Tutorial Page:** Instructions on how to play the game.
-   **Game Screen:** Drawing canvas, object to draw, and countdown timer.
-   **Victory Modal:** Displayed when the bot correctly guesses the drawing.
-   **History Page:** Users can view past games and scores.
-   **Leaderboard:** Displays top 100 players and their scores.

### Develop the FastAPI Backend

The backend handles user management, task management, and scoring mechanisms.

#### Users Management

-   **Registration:** Users can register with a username and password.
-   **Authentication:** Users authenticate to receive a JWT token.
-   **Protected Endpoints:** Access controlled using JWT tokens.

#### Tasks Management and Score Mechanism

-   **Task Status:** Tasks can be Running, Completed, Failed, or Error.
-   **Scoring Formula:** Score based on the time taken to complete the task.
-   **Leaderboard:** Tracks and displays user scores.

### Database Integration

MongoDB is used for storing user data, tasks, and scores. Asynchronous operations ensure performance efficiency.

### Local Building and Testing

To run the application locally:

1.  Clone the repository.
2.  Use the provided Docker Compose file to set up the environment.
3.  Assign an API key from OpenAI for full functionality.

then run: `docker-compose up`

Deployment to GKE
-----------------

Steps to deploy the application to GKE include:

1.  Building Docker images for the frontend and backend.
2.  Pushing images to Google Artifact Registry.
3.  Creating a GKE cluster and deploying Kubernetes objects.
4.  Configuring Horizontal Pod Autoscaler for scalability.

For detailed deployment commands and configurations, please refer to the Kubernetes and GKE sections in the repository.


 +++
