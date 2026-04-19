import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export const joinUserRoom = (userId) => {
  socket.emit("joinRoom", userId);
};

export const sendChatMessage = (payload) => {
  socket.emit("sendMessage", payload);
};

export default socket;
