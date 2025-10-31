import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chat", "routes/chat.tsx"),
  route("analyzer", "routes/analyzer.tsx"),
  route("tracker", "routes/tracker.tsx"),

  // API routes for serverless chat
  route("api/chat/start", "routes/api.chat.start.ts"),
  route("api/chat/poll", "routes/api.chat.poll.ts"),
  route("api/chat/send", "routes/api.chat.send.ts"),
  route("api/chat/end", "routes/api.chat.end.ts"),
] satisfies RouteConfig;
