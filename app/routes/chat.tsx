import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Route } from "./+types/chat";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "💩 Poop-Time Chat - Drop Bombs with Strangers" },
    { name: "description", content: "Chat anonymously with fellow toilet users worldwide. Connect while you dump!" },
  ];
}

type ChatState = "idle" | "waiting" | "matched";

interface Message {
  text: string;
  sender: "me" | "them";
  timestamp: Date;
}

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [roomId, setRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    // Listen for matching events
    newSocket.on("waiting", () => {
      setChatState("waiting");
    });

    newSocket.on("matched", ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      setChatState("matched");
      setMessages([]);
    });

    newSocket.on("receive-message", ({ message }: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { text: message, sender: "them", timestamp: new Date() },
      ]);
    });

    newSocket.on("partner-left", () => {
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
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const startSession = () => {
    if (socket) {
      socket.emit("start-session");
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !roomId) return;

    const message: Message = {
      text: inputMessage,
      sender: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, message]);
    socket.emit("send-message", { roomId, message: inputMessage });
    setInputMessage("");
  };

  const endSession = () => {
    if (socket && roomId) {
      socket.emit("end-session", { roomId });
    }
    setChatState("idle");
    setRoomId("");
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-700 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="text-6xl mb-3">💩🚽💬</div>
          <h1 className="text-5xl font-black text-yellow-200 mb-2" style={{textShadow: '2px 2px 0 #78350f'}}>
            Poop-Time Chat
          </h1>
          <p className="text-yellow-100 font-bold text-lg">
            💩 Anonymous Toilet Talk Worldwide 💩
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-900 to-yellow-800 rounded-lg shadow-2xl p-6 min-h-[500px] flex flex-col border-4 border-yellow-600">
          {chatState === "idle" && (
            <div className="flex flex-col items-center justify-center flex-1 bg-yellow-700/30 rounded-lg border-2 border-yellow-500/50">
              <div className="text-8xl mb-6 animate-bounce">🚽💩</div>
              <h2 className="text-3xl font-black text-yellow-100 mb-4">
                Ready to Drop Some Chat Bombs?
              </h2>
              <p className="text-yellow-200 mb-8 text-center max-w-md font-semibold text-lg">
                Get matched with another throne-sitter who's currently doing their business!
              </p>
              <button
                onClick={startSession}
                className="bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 active:from-yellow-500 active:to-amber-600 text-white font-black py-5 px-10 rounded-lg text-2xl transition-all shadow-xl hover:shadow-2xl active:shadow-2xl border-4 border-yellow-500 hover:scale-110 active:scale-105 touch-manipulation"
              >
                💩 START DUMPING 💩
              </button>
            </div>
          )}

          {chatState === "waiting" && (
            <div className="flex flex-col items-center justify-center flex-1 bg-yellow-700/30 rounded-lg border-2 border-yellow-500/50">
              <div className="text-8xl mb-6 animate-bounce">🚽🔍💩</div>
              <h2 className="text-3xl font-black text-yellow-100 mb-4">
                Sniffing Out a Fellow Pooper...
              </h2>
              <p className="text-yellow-200 text-center font-semibold text-lg">
                Hold tight! Looking for another person on the throne...
              </p>
              <div className="mt-8">
                <div className="flex space-x-3">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-5 h-5 bg-yellow-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}

          {chatState === "matched" && (
            <div className="flex flex-col h-full">
              <div className="border-b-4 border-yellow-600 pb-4 mb-4 bg-yellow-700/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-yellow-100">
                      💩 Matched! 💩
                    </h2>
                    <p className="text-sm text-yellow-200 font-semibold">
                      You're now chatting with a fellow toilet occupant!
                    </p>
                  </div>
                  <button
                    onClick={endSession}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-2 px-5 rounded-lg transition-all border-2 border-red-500 transform hover:scale-105"
                  >
                    🚪 FLUSH
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-yellow-900/20 rounded-lg p-3">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        msg.sender === "me"
                          ? "bg-gradient-to-r from-yellow-600 to-amber-700 text-white border-2 border-yellow-500"
                          : "bg-gradient-to-r from-amber-800 to-yellow-900 text-yellow-100 border-2 border-amber-600"
                      }`}
                    >
                      <p className="font-semibold">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Drop your thoughts... 💩"
                  className="flex-1 px-4 py-3 border-4 border-yellow-600 rounded-lg focus:outline-none focus:ring-4 focus:ring-yellow-400 bg-yellow-100 text-gray-900 font-semibold placeholder-yellow-700"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-black px-8 py-3 rounded-lg transition-all border-4 border-yellow-500 transform hover:scale-105"
                >
                  💩 SEND
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
