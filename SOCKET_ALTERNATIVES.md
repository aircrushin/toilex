# Socket.IO 替代方案

针对实时聊天功能，以下是几种可以在 Vercel 等无服务器平台使用的替代方案：

## 方案对比

| 方案 | Vercel 兼容 | 实时性 | 复杂度 | 成本 | 推荐度 |
|------|------------|--------|--------|------|--------|
| **1. Server-Sent Events (SSE)** | ✅ | ⭐⭐⭐⭐ | 中 | 免费 | ⭐⭐⭐⭐⭐ |
| **2. HTTP 长轮询** | ✅ | ⭐⭐⭐ | 低 | 免费 | ⭐⭐⭐⭐ |
| **3. 第三方服务 (Pusher/Ably)** | ✅ | ⭐⭐⭐⭐⭐ | 低 | 免费额度 | ⭐⭐⭐⭐ |
| **4. HTTP 短轮询** | ✅ | ⭐⭐ | 低 | 免费 | ⭐⭐ |

---

## 方案 1: Server-Sent Events (SSE) + HTTP API ⭐ 推荐

**优点:**
- ✅ Vercel 完全支持
- ✅ 实时性好（服务器可以主动推送）
- ✅ 无需额外服务器
- ✅ 自动重连

**缺点:**
- ⚠️ 只能服务器推送到客户端（单向）
- ⚠️ 发送消息需要额外的 HTTP 请求

### 实现架构

```
前端 ← SSE (接收消息) ← React Router Loader (流式响应)
前端 → HTTP POST (发送消息) → React Router Action
```

### 代码示例

#### 1. 创建 API 路由处理匹配和消息

**`app/routes/api.chat.tsx`** (新文件)

```typescript
import type { Route } from "./+types/api.chat";

// 内存存储（生产环境应使用 Redis/数据库）
const waitingUsers = new Map<string, { roomId: string; lastPing: number }>();
const rooms = new Map<string, { users: string[]; messages: Array<{ userId: string; message: string; timestamp: number }> }>();

// 启动会话 - 匹配用户
export async function action({ request }: Route.ActionArgs) {
  const { action, userId, roomId, message } = await request.json();

  if (action === "start-session") {
    // 查找等待中的用户
    const waitingUser = Array.from(waitingUsers.entries()).find(
      ([id]) => id !== userId
    );

    if (waitingUser) {
      const [partnerId] = waitingUser;
      const newRoomId = `room-${userId}-${partnerId}`;
      
      // 创建房间
      rooms.set(newRoomId, {
        users: [userId, partnerId],
        messages: []
      });

      // 移除等待队列
      waitingUsers.delete(partnerId);
      waitingUsers.delete(userId);

      return { status: "matched", roomId: newRoomId };
    } else {
      // 添加到等待队列
      waitingUsers.set(userId, { roomId: "", lastPing: Date.now() });
      return { status: "waiting" };
    }
  }

  if (action === "send-message") {
    const room = rooms.get(roomId);
    if (room) {
      room.messages.push({
        userId,
        message,
        timestamp: Date.now()
      });
      return { status: "sent" };
    }
  }

  if (action === "end-session") {
    const room = rooms.get(roomId);
    if (room) {
      room.users = room.users.filter(id => id !== userId);
      if (room.users.length === 0) {
        rooms.delete(roomId);
      }
    }
    return { status: "ended" };
  }

  return { status: "error" };
}

// SSE 流式响应 - 接收消息
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const roomId = url.searchParams.get("roomId");

  if (!userId || !roomId) {
    return new Response("Missing userId or roomId", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // 发送初始连接确认
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // 轮询检查新消息
      const checkMessages = setInterval(() => {
        const room = rooms.get(roomId);
        if (!room) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "partner-left" })}\n\n`)
          );
          clearInterval(checkMessages);
          controller.close();
          return;
        }

        // 获取新消息（排除自己发送的）
        const newMessages = room.messages.filter(
          msg => msg.userId !== userId && msg.timestamp > Date.now() - 5000
        );

        newMessages.forEach(msg => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "message", message: msg.message })}\n\n`)
          );
        });

        // 检查匹配状态
        if (room.users.length === 1) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "partner-left" })}\n\n`)
          );
          clearInterval(checkMessages);
          controller.close();
        }
      }, 1000); // 每秒检查一次

      // 客户端断开连接时清理
      request.signal.addEventListener("abort", () => {
        clearInterval(checkMessages);
        const room = rooms.get(roomId);
        if (room) {
          room.users = room.users.filter(id => id !== userId);
          if (room.users.length === 0) {
            rooms.delete(roomId);
          }
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

#### 2. 修改前端 `chat.tsx`

```typescript
import { useEffect, useState, useRef } from "react";
import type { Route } from "./+types/chat";

type ChatState = "idle" | "waiting" | "matched";

interface Message {
  text: string;
  sender: "me" | "them";
  timestamp: Date;
}

export default function Chat() {
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [roomId, setRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [userId] = useState(() => `user-${Date.now()}-${Math.random()}`);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 连接 SSE
  useEffect(() => {
    if (roomId && chatState === "matched") {
      const eventSource = new EventSource(
        `/api/chat?userId=${userId}&roomId=${roomId}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "message") {
          setMessages((prev) => [
            ...prev,
            { text: data.message, sender: "them", timestamp: new Date() },
          ]);
        } else if (data.type === "partner-left") {
          setMessages((prev) => [
            ...prev,
            {
              text: "Your chat partner has left the session.",
              sender: "them",
              timestamp: new Date(),
            },
          ]);
          setTimeout(() => {
            setChatState("idle");
            setRoomId("");
            setMessages([]);
          }, 2000);
        }
      };

      eventSourceRef.current = eventSource;

      return () => {
        eventSource.close();
      };
    }
  }, [roomId, chatState, userId]);

  const startSession = async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start-session", userId }),
    });

    const data = await response.json();
    
    if (data.status === "waiting") {
      setChatState("waiting");
    } else if (data.status === "matched") {
      setRoomId(data.roomId);
      setChatState("matched");
      setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !roomId) return;

    const message: Message = {
      text: inputMessage,
      sender: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);

    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send-message",
        userId,
        roomId,
        message: inputMessage,
      }),
    });

    setInputMessage("");
  };

  const endSession = async () => {
    if (roomId) {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end-session", userId, roomId }),
      });
    }
    setChatState("idle");
    setRoomId("");
    setMessages([]);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  };

  // ... UI 代码保持不变
}
```

---

## 方案 2: HTTP 长轮询

**优点:**
- ✅ Vercel 完全支持
- ✅ 实现简单
- ✅ 无需额外依赖

**缺点:**
- ⚠️ 实时性稍差（有延迟）
- ⚠️ 服务器连接占用时间较长

### 实现思路

客户端定期请求 `/api/chat/poll`，服务器保持连接打开直到有新消息或超时。

---

## 方案 3: 第三方服务 (Pusher/Ably) ⭐ 最简单

**优点:**
- ✅ Vercel 完全支持
- ✅ 实时性最好
- ✅ 无需自己管理服务器
- ✅ 免费额度通常足够

**缺点:**
- ⚠️ 依赖第三方服务
- ⚠️ 有使用限制（免费额度）

### Pusher 示例

```bash
npm install pusher pusher-js
```

#### 服务器端 (React Router Action)

```typescript
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
});

export async function action({ request }: Route.ActionArgs) {
  const { action, userId, roomId, message } = await request.json();

  if (action === "send-message") {
    pusher.trigger(roomId, "new-message", { userId, message });
    return { status: "sent" };
  }
  // ...
}
```

#### 客户端

```typescript
import Pusher from "pusher-js";

const pusher = new Pusher(process.env.VITE_PUSHER_KEY!, {
  cluster: process.env.VITE_PUSHER_CLUSTER!,
});

const channel = pusher.subscribe(roomId);
channel.bind("new-message", (data) => {
  // 处理新消息
});
```

**免费额度:**
- Pusher: 200,000 消息/天
- Ably: 3M 消息/月

---

## 方案 4: HTTP 短轮询

**优点:**
- ✅ 最简单
- ✅ Vercel 完全支持

**缺点:**
- ⚠️ 实时性差（需要频繁请求）
- ⚠️ 服务器负载高

实现：客户端每 1-2 秒请求一次 `/api/chat/status` 检查新消息。

---

## 推荐方案

对于你的项目，我推荐：

1. **如果要完全兼容 Vercel**: 使用 **方案 1 (SSE)** 或 **方案 3 (Pusher)**
2. **如果要最简单**: 使用 **方案 3 (Pusher)**
3. **如果要零成本且不依赖第三方**: 使用 **方案 1 (SSE)**

需要我帮你实现其中某个方案吗？

