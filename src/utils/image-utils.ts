/**
 * Utility function to format and validate avatar URLs.
 * Handles missing protocols and provides fallback avatars.
 * 
 * @param url - The source URL of the avatar
 * @param name - Fallback name to generate an initial-based avatar
 * @returns A validated URL string
 */
export const getAvatarUrl = (url?: string | null, name: string = 'User'): string => {
  if (!url) {
    // Use DiceBear for consistent, nice-looking fallback avatars
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  }

  // Handle data URLs
  if (url.startsWith('data:')) {
    return url;
  }

  // Ensure absolute URL
  let formattedUrl = url;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    // If it looks like a domain or relative path without protocol
    formattedUrl = `https://${formattedUrl.replace(/^\/+/, '')}`;
  }

  return formattedUrl;
};

/**
 * Utility function to format and validate media URLs (images, videos, files).
 * Ensures absolute URL format with protocols and handles relative or data URLs.
 * 
 * @param url - The source URL of the media
 * @returns A validated absolute URL string
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url) return "";

  // Handle data URLs or relative absolute paths
  if (url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }

  // Ensure absolute URL with protocols
  let formattedUrl = url;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl.replace(/^\/+/, '')}`;
  }

  return formattedUrl;
};
