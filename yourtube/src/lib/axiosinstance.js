import axios from "axios";
const axiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL || 'https://nullclass-assignment-1serser.onrender.com/',
});
export default axiosInstance;
