import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("chat", "routes/chat.tsx"),
  route("analyzer", "routes/analyzer.tsx"),
  route("tracker", "routes/tracker.tsx")
] satisfies RouteConfig;
