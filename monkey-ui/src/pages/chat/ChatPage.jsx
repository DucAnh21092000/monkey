import { Button, Card, Input, List, Space, Tag, Typography, message, Switch, Radio } from "antd";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { baseUrl } from "../homepage/const";

const socketUrl = (import.meta.env.VITE_SOCKET_URL || baseUrl || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const getInitialName = () => {
  if (typeof window === "undefined") return "User";
  return (
    localStorage.getItem("monkey-chat-username") || `User-${Math.floor(Math.random() * 900 + 100)}`
  );
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
  const usernameRef = useRef(username);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [unread, setUnread] = useState(0);
  const isWindowFocusedRef = useRef(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundMode, setSoundMode] = useState("beep"); // 'beep' | 'file'
  const [soundDataUrl, setSoundDataUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    const socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connect error:", error);
      message.error("Không thể kết nối tới server chat. Vui lòng thử lại sau.");
      setJoined(false);
    });

    socket.on("history", (history) => {
      setMessages(history || []);
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // if message not from current user, play sound
      if (msg.username !== usernameRef.current && soundEnabled) {
        try {
          if (soundMode === "file" && soundDataUrl) {
            const a = new Audio(soundDataUrl);
            a.volume = 0.8;
            a.play().catch(() => {});
          } else {
            // simple beep via Web Audio API
            const playBeep = () => {
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = "sine";
                o.frequency.value = 700;
                g.gain.value = 0.05;
                o.connect(g);
                g.connect(ctx.destination);
                o.start();
                setTimeout(() => {
                  o.stop();
                  ctx.close().catch(() => {});
                }, 180);
              } catch (e) {}
            };
            playBeep();
          }
        } catch (e) {}
      }
      // if window not focused and message not from current user, notify
      if (!isWindowFocusedRef.current && msg.username !== usernameRef.current) {
        setUnread((prev) => {
          const next = prev + 1;
          try {
            document.title = `(${next}) Chat`;
          } catch (e) {}
          return next;
        });
        notifyBrowser(msg);
      }
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

  useEffect(() => {
    // scroll to bottom when messages update
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    try {
      const mode = localStorage.getItem("monkey-chat-sound-mode");
      const data = localStorage.getItem("monkey-chat-sound-dataurl");
      if (mode) setSoundMode(mode);
      if (data) setSoundDataUrl(data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    const onFocus = () => {
      setIsWindowFocused(true);
      setUnread(0);
      document.title = "Chat";
    };
    const onBlur = () => setIsWindowFocused(false);
    // keep ref in sync for socket callbacks
    const wrappedOnFocus = () => {
      isWindowFocusedRef.current = true;
      onFocus();
    };
    const wrappedOnBlur = () => {
      isWindowFocusedRef.current = false;
      onBlur();
    };
    window.addEventListener("focus", wrappedOnFocus);
    window.addEventListener("blur", wrappedOnBlur);
    return () => {
      window.removeEventListener("focus", wrappedOnFocus);
      window.removeEventListener("blur", wrappedOnBlur);
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

    // Request notification permission
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
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

  const notifyBrowser = (msg) => {
    try {
      if (typeof Notification === "undefined") return;
      if (Notification.permission === "granted") {
        const title = msg.username ? `${msg.username} gửi tin nhắn` : "Tin nhắn mới";
        const n = new Notification(title, {
          body: msg.text,
        });
        setTimeout(() => n.close(), 5000);
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <Card
      title="Chat real-time"
      extra={<Tag color="green">Phòng: {room}</Tag>}
      style={{ maxWidth: 900, margin: "0 auto" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Text>Âm</Typography.Text>
            <Switch checked={soundEnabled} onChange={(v) => setSoundEnabled(v)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Radio.Group
              value={soundMode}
              onChange={(e) => {
                const v = e.target.value;
                setSoundMode(v);
                try {
                  localStorage.setItem("monkey-chat-sound-mode", v);
                } catch (e) {}
              }}>
              <Radio value="beep">Beep</Radio>
              <Radio value="file">File</Radio>
            </Radio.Group>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const data = ev.target.result;
                  setSoundDataUrl(data);
                  try {
                    localStorage.setItem("monkey-chat-sound-dataurl", data);
                  } catch (err) {}
                };
                reader.readAsDataURL(f);
              }}
            />
            <Button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}>
              Upload
            </Button>
          </div>
        </div>

        <Typography.Text type="secondary">
          Người đang online trong phòng: {onlineCount}
        </Typography.Text>

        <div
          ref={listRef}
          style={{
            minHeight: 360,
            maxHeight: 480,
            overflowY: "auto",
            border: "1px solid #f0f0f0",
            borderRadius: 12,
            padding: 12,
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
          }}>
          <List
            dataSource={messages}
            locale={{ emptyText: "Chưa có tin nhắn nào" }}
            renderItem={(item) =>
              item.system ? (
                <List.Item style={{ justifyContent: "center" }}>
                  <Typography.Text type="secondary">{item.text}</Typography.Text>
                </List.Item>
              ) : (
                <List.Item style={{ border: "none", padding: 6 }}>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: item.username === username ? "flex-end" : "flex-start",
                    }}>
                    <div
                      style={{
                        maxWidth: "75%",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-end",
                        flexDirection: item.username === username ? "row-reverse" : "row",
                      }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          background: `#${(function (s) {
                            let h = 0;
                            for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
                            return ((h >>> 0) & 0xffffff).toString(16).padStart(6, "0");
                          })(item.username || "?")}`,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                        }}>
                        {(item.username || "?").charAt(0).toUpperCase()}
                      </div>

                      <div
                        style={{
                          background: item.username === username ? "#1890ff" : "#fff",
                          color: item.username === username ? "#fff" : "#000",
                          padding: "10px 12px",
                          borderRadius: 12,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                        }}>
                        <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.9 }}>
                          <Typography.Text
                            strong
                            style={{ color: item.username === username ? "#fff" : "#000" }}>
                            {item.username}
                          </Typography.Text>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{item.text}</div>
                        <div style={{ textAlign: "right", marginTop: 6 }}>
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(item.createdAt).toLocaleTimeString()}
                          </Typography.Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )
            }
          />
          <div ref={bottomRef} />
        </div>

        <Input.TextArea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nhập tin nhắn..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <Button type="primary" onClick={handleSend} disabled={!joined}>
          Gửi tin nhắn
        </Button>
      </Space>
    </Card>
  );
}
