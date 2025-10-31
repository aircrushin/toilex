import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TOILEX - Your #2 Destination for #2" },
    { name: "description", content: "The ultimate toilet experience platform. Chat, analyze, and track your bathroom adventures!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
