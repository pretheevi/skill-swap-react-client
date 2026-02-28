import axios from "axios";

const API  = axios.create({
  baseURL:  "https://insta-mirror-server.onrender.com/api",
});

// request interceptor to add token to headers
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if(token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
})

export default API;

// http://localhost:8080/api
// "https://insta-mirror-server.onrender.com"