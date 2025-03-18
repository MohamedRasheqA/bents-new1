import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { VideoReference } from "@/app/types/index"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// lib/utils.ts
export function processVideoReferences(content: string): {
  processedAnswer: string;
  videoDict: Record<string, VideoReference>;
} {
  const videoPattern = /\{timestamp:([^}]+)\}\{title:([^}]+)\}\{url:([^}]+)\}/g;
  const videoDict: Record<string, VideoReference> = {};
  let index = 0;
  
  const processedAnswer = content.replace(videoPattern, (match, timestamp, title, url) => {
    videoDict[index.toString()] = {
      urls: [combineUrlAndTimestamp(url.trim(), timestamp.trim())],
      timestamp: timestamp.trim(),
      video_title: title.trim(),
      description: `Demonstration at ${timestamp} in ${title}`
    };
    index++;
    return '';
  });

  return { processedAnswer: processedAnswer.trim(), videoDict };
}

export function combineUrlAndTimestamp(url: string, timestamp: string): string {
  try {
    const parts = timestamp.split(':');
    const totalSeconds = parts.length === 2 
      ? parseInt(parts[0]) * 60 + parseInt(parts[1])
      : parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${totalSeconds}`;
  } catch {
    return url;
  }
}
