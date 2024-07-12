import axios from "axios";

export const instance = axios.create({
    baseURL: "http://34.105.27.9:8080/api/",
    //baseURL: "http://localhost:8000/",
    headers: {
        "Content-Type": "application/json",
    },
});