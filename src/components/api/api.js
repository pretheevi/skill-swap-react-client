import axios from "axios";

const httpUrl = [
  "https://insta-mirror-server.onrender.com/api",
  "http://localhost:8080/api"
]

const API = axios.create({
  baseURL: httpUrl[0],
});

// request interceptor to add token to headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default API;
