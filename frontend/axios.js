import axios from "axios";

export const instance = axios.create({
    baseURL: "http://34.154.131.112:8080/api/",
    //baseURL: "http://localhost:8000/",
    headers: {
        "Content-Type": "application/json",
    },
});