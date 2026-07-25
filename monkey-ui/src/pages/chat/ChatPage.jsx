import { Button, Card, Input, List, Space, Tag, Typography, message } from "antd";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const getInitialName = () => {
  if (typeof window === "undefined") return "User";
  return localStorage.getItem("monkey-chat-username") || `User-${Math.floor(Math.random() * 900 + 100)}`;
};

const getInitialRoom = () => {
  if (typeof window === "undefined") return "room-demo";
  return localStorage.getItem("monkey-chat-room") || "room-demo";
};

export default function ChatPage() {
  const [username, setUsername] = useState(getInitialName);
  const [room, setRoom] = useState(getInitialRoom);
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("connect_error", () => {
      message.error("Không thể kết nối tới server chat");
      setJoined(false);
    });

    socket.on("history", (history) => {
      setMessages(history || []);
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("system_message", (msg) => {
      setMessages((prev) => [...prev, { ...msg, system: true }]);
    });

    socket.on("room_users", ({ count }) => {
      setOnlineCount(count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleJoin = () => {
    const socket = socketRef.current;
    if (!socket) return;

    if (typeof window !== "undefined") {
      localStorage.setItem("monkey-chat-username", username);
      localStorage.setItem("monkey-chat-room", room);
    }

    socket.emit("join", { room, username });
    setJoined(true);
    setMessages([]);
    message.success(`Đã vào phòng ${room}`);
  };

  const handleSend = () => {
    const socket = socketRef.current;
    if (!socket || !joined) return;

    const text = draft.trim();
    if (!text) return;

    socket.emit("send_message", {
      room,
      username,
      text,
    });

    setDraft("");
  };

  return (
    <Card
      title="Chat real-time"
      extra={<Tag color="green">Phòng: {room}</Tag>}
      style={{ maxWidth: 900, margin: "0 auto" }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input
            style={{ flex: 1, minWidth: 220 }}
            placeholder="Tên của bạn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            style={{ flex: 1, minWidth: 220 }}
            placeholder="Tên phòng chat"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <Button type="primary" onClick={handleJoin}>
            Vào phòng
          </Button>
        </div>

        <Typography.Text type="secondary">
          Người đang online trong phòng: {onlineCount}
        </Typography.Text>

        <div
          style={{
            minHeight: 360,
            maxHeight: 480,
            overflowY: "auto",
            border: "1px solid #f0f0f0",
            borderRadius: 12,
            padding: 12,
            background: "#fafafa",
          }}
        >
          <List
            dataSource={messages}
            locale={{ emptyText: "Chưa có tin nhắn nào" }}
            renderItem={(item) =>
              item.system ? (
                <List.Item style={{ justifyContent: "center" }}>
                  <Typography.Text type="secondary">{item.text}</Typography.Text>
                </List.Item>
              ) : (
                <List.Item>
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography.Text strong>{item.username}</Typography.Text>
                      <Typography.Text type="secondary">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </Typography.Text>
                    </div>
                    <div style={{ marginTop: 4 }}>{item.text}</div>
                  </div>
                </List.Item>
              )
            }
          />
        </div>

        <Input.TextArea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nhập tin nhắn..."
        />

        <Button type="primary" onClick={handleSend} disabled={!joined}>
          Gửi tin nhắn
        </Button>
      </Space>
    </Card>
  );
}
