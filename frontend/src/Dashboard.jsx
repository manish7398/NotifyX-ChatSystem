import { useEffect, useRef, useState, useCallback } from "react";
import socket, { joinUserRoom, sendChatMessage } from "./socket";
import API from "./api";
import { jwtDecode } from "jwt-decode";
import "./App.css";

/* ─── Helpers ─── */
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function formatLastSeen(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "last seen just now";
  if (diff < 3600) return `last seen ${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `last seen at ${formatTime(dateStr)}`;
  return `last seen ${formatDate(dateStr)}`;
}

function Tick({ status }) {
  if (!status) return null;
  if (status === "sent")      return <span className="msg-tick sent"      title="Sent">✓</span>;
  if (status === "delivered") return <span className="msg-tick delivered" title="Delivered">✓✓</span>;
  if (status === "seen")      return <span className="msg-tick seen"      title="Seen">✓✓</span>;
  return null;
}

function Avatar({ name, color, size = "normal", isOnline }) {
  const sizeClass = size === "small" ? "avatar-sm" : size === "large" ? "avatar-lg" : size === "xs" ? "avatar-xs" : size === "md" ? "avatar-md" : "";
  return (
    <div className={`avatar ${sizeClass}`} style={{ background: color || "#25d366" }}>
      {getInitials(name)}
      {isOnline !== undefined && (
        <span className={`avatar-status ${isOnline ? "online" : "offline"}`} />
      )}
    </div>
  );
}

function ContextMenu({ x, y, onDelete, onDeleteForEveryone, isMine, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Keep menu inside viewport
  const menuX = Math.min(x, window.innerWidth - 180);
  const menuY = Math.min(y, window.innerHeight - 120);

  return (
    <div ref={ref} className="ctx-menu" style={{ top: menuY, left: menuX }}>
      <button className="ctx-item" onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        Delete for me
      </button>
      {isMine && (
        <button className="ctx-item ctx-item-danger" onClick={onDeleteForEveryone}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          Delete for everyone
        </button>
      )}
    </div>
  );
}

/* ─── Icons as components ─── */
const IconSend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconDots = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const IconEmoji = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);
const IconAttach = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

/* ─── Main ─── */
function Dashboard({ setToken }) {
  const [users, setUsers]               = useState([]);
  const [search, setSearch]             = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [isTyping, setIsTyping]         = useState(false);
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [ctxMenu, setCtxMenu]           = useState(null);
  const [toast, setToast]               = useState(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showSidebar, setShowSidebar]   = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const selectedRef    = useRef(null);
  const inputRef       = useRef(null);
  const toastTimer     = useRef(null);

  const token   = localStorage.getItem("token");
  const decoded = jwtDecode(token);
  const userId  = decoded.id;

  useEffect(() => { selectedRef.current = selectedUser; }, [selectedUser]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = useCallback(async (q = "") => {
    try {
      const res = await API.get("/api/users", { params: q ? { search: q } : {} });
      setUsers(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await API.get("/api/users/unread-counts");
      setUnreadCounts(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  useEffect(() => {
    joinUserRoom(userId);

    socket.on("onlineUsers", (list) => setOnlineUsers(list));

    socket.on("receiveMessage", (msg) => {
      const selected = selectedRef.current;
      if (selected && msg.senderId === selected._id) {
        setMessages((prev) => [...prev, msg]);
        socket.emit("messageSeen", { messageId: msg._id, senderId: msg.senderId });
      } else {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
        setUsers((prev) => {
          const sender = prev.find((u) => u._id === msg.senderId);
          if (sender) showToast(`💬 ${sender.name}: ${msg.message.slice(0, 50)}${msg.message.length > 50 ? "…" : ""}`);
          return prev;
        });
      }
    });

    socket.on("messageDelivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "delivered" } : m))
      );
    });

    socket.on("messageSeen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "seen" } : m))
      );
    });

    socket.on("allMessagesSeen", ({ messageIds }) => {
      const idSet = new Set(messageIds.map(String));
      setMessages((prev) =>
        prev.map((m) => (idSet.has(String(m._id)) ? { ...m, status: "seen" } : m))
      );
    });

    socket.on("typing",     ({ senderId }) => {
      if (selectedRef.current?._id === senderId) setIsTyping(true);
    });
    socket.on("stopTyping", ({ senderId }) => {
      if (selectedRef.current?._id === senderId) setIsTyping(false);
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
    });

    socket.on("notification", (notif) => showToast(`🔔 ${notif.message}`));

    return () => socket.off();
  }, [userId, showToast]);

  const loadChat = async (user) => {
    setSelectedUser(user);
    setMessages([]);
    setIsTyping(false);
    setIsLoadingChat(true);
    if (window.innerWidth < 768) setShowSidebar(false);

    try {
      const res = await API.get(`/api/messages/${user._id}`);
      setMessages(res.data);
    } catch {}

    setIsLoadingChat(false);
    setUnreadCounts((prev) => ({ ...prev, [user._id]: 0 }));
    socket.emit("markAllSeen", { senderId: user._id, receiverId: userId });
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!text.trim() || !selectedUser) return;
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderId: userId,
      receiverId: selectedUser._id,
      message: text.trim(),
      status: "sent",
      createdAt: new Date().toISOString(),
    };
    sendChatMessage({ senderId: userId, receiverId: selectedUser._id, message: text.trim() });
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    socket.emit("stopTyping", { receiverId: selectedUser._id, senderId: userId });
  };

  const handleInput = (e) => {
    setText(e.target.value);
    if (!selectedUser) return;
    socket.emit("typing", { receiverId: selectedUser._id, senderId: userId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selectedUser._id, senderId: userId });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const logout = () => { localStorage.removeItem("token"); setToken(null); };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    fetchUsers(q);
  };

  const handleMsgCtx = (e, msg) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const deleteMessage = async (msg, forEveryone) => {
    setCtxMenu(null);
    try {
      await API.delete(`/api/messages/${msg._id}`, { data: { deleteForEveryone: forEveryone } });
      if (forEveryone) {
        socket.emit("deleteMessage", {
          messageId: msg._id, senderId: userId,
          receiverId: selectedUser._id, deleteForEveryone: true,
        });
      }
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(msg._id)));
    } catch {}
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const key = formatDate(msg.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const onlineUsersList = users.filter((u) => onlineUsers.includes(u._id));

  return (
    <div className="app-shell">
      {/* ── Toast ── */}
      {toast && <div className="toast">{toast}</div>}

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y}
          isMine={ctxMenu.msg.senderId === userId}
          onDelete={() => deleteMessage(ctxMenu.msg, false)}
          onDeleteForEveryone={() => deleteMessage(ctxMenu.msg, true)}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {/* ════════════ SIDEBAR ════════════ */}
      <aside className={`sidebar ${showSidebar ? "" : "sidebar-hidden"}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrap">💬</div>
            <span className="brand-name">NotifyX</span>
            {totalUnread > 0 && (
              <span className="brand-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
            )}
          </div>
          <div className="sidebar-actions">
            <button className="icon-btn" title="Logout" onClick={logout}>
              <IconLogout />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-box">
          <span className="search-icon"><IconSearch /></span>
          <input
            className="search-input"
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(""); fetchUsers(); }}>✕</button>
          )}
        </div>

        {/* Active users strip */}
        {onlineUsersList.length > 0 && !search && (
          <div className="active-strip">
            <p className="active-strip-label">Active now</p>
            <div className="active-strip-row">
              {onlineUsersList.slice(0, 7).map((u) => (
                <button key={u._id} className="active-user-btn" onClick={() => loadChat(u)} title={u.name}>
                  <div className="avatar avatar-sm" style={{ background: u.avatarColor || "#25d366" }}>
                    {getInitials(u.name)}
                    <span className="avatar-status online" />
                  </div>
                  <span className="active-user-name">{u.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="section-divider">
          <span>Chats</span>
        </div>

        {/* User list */}
        <div className="user-list">
          {users.length === 0 ? (
            <div className="empty-list">
              <span className="empty-icon">🔍</span>
              <span>No users found</span>
            </div>
          ) : (
            users.map((u) => {
              const active  = selectedUser?._id === u._id;
              const online  = onlineUsers.includes(u._id);
              const unread  = unreadCounts[u._id] || 0;
              return (
                <button key={u._id} className={`user-item ${active ? "user-item-active" : ""}`} onClick={() => loadChat(u)}>
                  <div className="avatar" style={{ background: u.avatarColor || "#25d366" }}>
                    {getInitials(u.name)}
                    <span className={`avatar-status ${online ? "online" : "offline"}`} />
                  </div>
                  <div className="user-info">
                    <div className="user-row">
                      <span className="user-name">{u.name}</span>
                      {unread > 0 && (
                        <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>
                      )}
                    </div>
                    <span className="user-status">
                      {online ? <span className="status-dot-label">● Online</span> : formatLastSeen(u.lastSeen)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ════════════ CHAT PANEL ════════════ */}
      <main className="chat-panel">
        {!selectedUser ? (
          /* Empty state */
          <div className="empty-state">
            <div className="empty-state-inner">
              <div className="empty-state-icon">💬</div>
              <h2 className="empty-state-title">NotifyX</h2>
              <p className="empty-state-sub">
                Send and receive messages to your contacts.<br />Select a chat to get started.
              </p>
              <div className="empty-pills">
                <span className="pill">🔒 Encrypted</span>
                <span className="pill">⚡ Real-time</span>
                <span className="pill">✓✓ Read receipts</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="back-btn" onClick={() => { setSelectedUser(null); setShowSidebar(true); }}>
                <IconBack />
              </button>
              <div className="avatar avatar-md" style={{ background: selectedUser.avatarColor || "#25d366" }}>
                {getInitials(selectedUser.name)}
                <span className={`avatar-status ${isOnline ? "online" : "offline"}`} />
              </div>
              <div className="chat-hdr-info">
                <span className="chat-hdr-name">{selectedUser.name}</span>
                <span className={`chat-hdr-status ${isTyping ? "typing" : isOnline ? "status-online" : ""}`}>
                  {isTyping ? "typing…" : isOnline ? "Online" : formatLastSeen(selectedUser.lastSeen)}
                </span>
              </div>
              <div className="chat-hdr-actions">
                <button className="icon-btn" title="More">
                  <IconDots />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-wrap">
              {isLoadingChat ? (
                <div className="chat-loader">
                  <div className="spinner" />
                  <span>Loading messages…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-no-msgs">
                  <div className="avatar avatar-lg" style={{ background: selectedUser.avatarColor || "#25d366" }}>
                    {getInitials(selectedUser.name)}
                  </div>
                  <p>Start chatting with <strong>{selectedUser.name}</strong></p>
                  <span className="chat-no-msgs-sub">Messages are end-to-end encrypted</span>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <div className="date-sep"><span>{dateKey}</span></div>
                    {msgs.map((msg, i) => {
                      const isMine    = msg.senderId === userId;
                      const showAvatar = !isMine && (i === 0 || msgs[i - 1]?.senderId !== msg.senderId);
                      return (
                        <div
                          key={msg._id}
                          className={`msg-row ${isMine ? "msg-mine" : "msg-theirs"}`}
                          onContextMenu={(e) => handleMsgCtx(e, msg)}
                        >
                          {!isMine && (
                            <div className="msg-avatar-col">
                              {showAvatar ? (
                                <div className="avatar avatar-xs" style={{ background: selectedUser.avatarColor || "#25d366" }}>
                                  {getInitials(selectedUser.name)}
                                </div>
                              ) : <div className="avatar-xs-spacer" />}
                            </div>
                          )}
                          <div className={`bubble ${isMine ? "bubble-mine" : "bubble-theirs"}`}>
                            <span className="bubble-text">{msg.message}</span>
                            <div className="bubble-footer">
                              <span className="bubble-time">{formatTime(msg.createdAt)}</span>
                              {isMine && <Tick status={msg.status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Typing bubble */}
              {isTyping && (
                <div className="msg-row msg-theirs">
                  <div className="msg-avatar-col">
                    <div className="avatar avatar-xs" style={{ background: selectedUser.avatarColor || "#25d366" }}>
                      {getInitials(selectedUser.name)}
                    </div>
                  </div>
                  <div className="bubble bubble-theirs typing-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="input-bar">
              <button className="input-icon-btn" title="Emoji"><IconEmoji /></button>
              <button className="input-icon-btn" title="Attach"><IconAttach /></button>
              <textarea
                ref={inputRef}
                className="msg-textarea"
                placeholder={`Message ${selectedUser.name}…`}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className={`send-btn ${text.trim() ? "send-active" : ""}`}
                onClick={sendMessage}
                disabled={!text.trim()}
                title="Send"
              >
                <IconSend />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
