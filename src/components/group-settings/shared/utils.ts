// shared/utils.ts
export const getInitials = (name: string) =>
    (name || "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

export const normalizeUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
};

export const AVATAR_COLORS = [
    "bg-blue-100 text-blue-800",
    "bg-teal-100 text-teal-800",
    "bg-violet-100 text-violet-800",
    "bg-orange-100 text-orange-800",
    "bg-amber-100 text-amber-800",
    "bg-pink-100 text-pink-800",
    "bg-emerald-100 text-emerald-800",
];

export const avatarColor = (name: string) =>
    AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];