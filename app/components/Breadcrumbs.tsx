import { Link, useLocation } from "react-router";

interface BreadcrumbItem {
  label: string;
  path: string;
  emoji?: string;
}

const routeConfig: Record<string, BreadcrumbItem> = {
  "": { label: "Powpdr", path: "/", emoji: "🚽" },
  "auth": { label: "Auth", path: "/auth", emoji: "🔐" },
  "chat": { label: "Poop-Time Chat", path: "/chat", emoji: "💬" },
  "analyzer": { label: "Poop Analyzer", path: "/analyzer", emoji: "🔬" },
  "tracker": { label: "Throne Tracker", path: "/tracker", emoji: "📊" },
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb trail
  const breadcrumbs: BreadcrumbItem[] = [
    routeConfig[""], // Always include home
  ];

  // Add current page if not home
  if (pathSegments.length > 0) {
    const currentSegment = pathSegments[0];
    if (routeConfig[currentSegment]) {
      breadcrumbs.push(routeConfig[currentSegment]);
    }
  }

  // Don't show breadcrumbs on home page
  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm font-semibold">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={crumb.path} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-yellow-300 opacity-60">💩</span>
            )}
            {isLast ? (
              <span className="text-yellow-100 flex items-center gap-1">
                <span>{crumb.emoji}</span>
                <span>{crumb.label}</span>
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-yellow-200 hover:text-yellow-100 underline flex items-center gap-1 transition-colors"
              >
                <span>{crumb.emoji}</span>
                <span>{crumb.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
