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
