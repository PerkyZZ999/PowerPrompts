/**
 * Utility functions for the frontend.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS conflict resolution.
 *
 * @param inputs - Class names to merge
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format duration in seconds to human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2m 30s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format large numbers with commas.
 *
 * @param num - Number to format
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Truncate text to specified length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

/**
 * Get color class for metric score.
 *
 * @param score - Metric score (0-100)
 * @returns Tailwind color class
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

/**
 * Calculate percentage change between two numbers.
 *
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change with sign
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number,
): string {
  if (oldValue === 0) return "+100%";

  const change = ((newValue - oldValue) / oldValue) * 100;
  const sign = change >= 0 ? "+" : "";

  return `${sign}${change.toFixed(1)}%`;
}
