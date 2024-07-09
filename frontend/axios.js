import axios from "axios";

export const instance = axios.create({
    baseURL: "https://sketch.sonar.wiki/",
    headers: {
        "Content-Type": "application/json",
    },
});