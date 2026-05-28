import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

API.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("imaginai_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("imaginai_token");
        localStorage.removeItem("imaginai_user");
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default API;