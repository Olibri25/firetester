// AK FISH Shared Utilities

import type { Coordinates, BoundingBox, FishSpecies } from '../types';

// ============================================
// Geographic Utilities
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBounds(
  point: Coordinates,
  bounds: BoundingBox
): boolean {
  return (
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
}

/**
 * Get the center of a bounding box
 */
export function getBoundsCenter(bounds: BoundingBox): Coordinates {
  return {
    latitude: (bounds.north + bounds.south) / 2,
    longitude: (bounds.east + bounds.west) / 2,
  };
}

/**
 * Expand bounds by a percentage
 */
export function expandBounds(bounds: BoundingBox, percent: number): BoundingBox {
  const latDiff = bounds.north - bounds.south;
  const lonDiff = bounds.east - bounds.west;
  const latExpand = latDiff * (percent / 100);
  const lonExpand = lonDiff * (percent / 100);

  return {
    north: bounds.north + latExpand,
    south: bounds.south - latExpand,
    east: bounds.east + lonExpand,
    west: bounds.west - lonExpand,
  };
}

/**
 * Convert degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  coords: Coordinates,
  format: 'decimal' | 'dms' = 'decimal'
): string {
  if (format === 'decimal') {
    return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
  }

  const latDir = coords.latitude >= 0 ? 'N' : 'S';
  const lonDir = coords.longitude >= 0 ? 'E' : 'W';

  const lat = Math.abs(coords.latitude);
  const lon = Math.abs(coords.longitude);

  const latDeg = Math.floor(lat);
  const latMin = Math.floor((lat - latDeg) * 60);
  const latSec = ((lat - latDeg) * 60 - latMin) * 60;

  const lonDeg = Math.floor(lon);
  const lonMin = Math.floor((lon - lonDeg) * 60);
  const lonSec = ((lon - lonDeg) * 60 - lonMin) * 60;

  return `${latDeg}°${latMin}'${latSec.toFixed(1)}"${latDir} ${lonDeg}°${lonMin}'${lonSec.toFixed(1)}"${lonDir}`;
}

// ============================================
// Date & Time Utilities
// ============================================

/**
 * Format a date for display
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'iso' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'iso':
      return d.toISOString().split('T')[0];
  }
}

/**
 * Format a time for display
 */
export function formatTime(
  date: string | Date,
  use24Hour: boolean = false
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return formatDate(d, 'short');
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// ============================================
// Number Formatting
// ============================================

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format fish count with appropriate suffix
 */
export function formatFishCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
  if (count < 1000000) return `${Math.round(count / 1000)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

/**
 * Format distance in miles
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    const feet = miles * 5280;
    return `${Math.round(feet)} ft`;
  }
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(miles)} mi`;
}

/**
 * Format temperature
 */
export function formatTemperature(
  temp: number,
  unit: 'F' | 'C' = 'F'
): string {
  return `${Math.round(temp)}°${unit}`;
}

// ============================================
// String Utilities
// ============================================

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get species display name
 */
export function getSpeciesName(species: FishSpecies): string {
  const names: Record<FishSpecies, string> = {
    king_salmon: 'King Salmon',
    sockeye_salmon: 'Sockeye Salmon',
    coho_salmon: 'Coho Salmon',
    pink_salmon: 'Pink Salmon',
    chum_salmon: 'Chum Salmon',
    rainbow_trout: 'Rainbow Trout',
    dolly_varden: 'Dolly Varden',
    arctic_char: 'Arctic Char',
    lake_trout: 'Lake Trout',
    arctic_grayling: 'Arctic Grayling',
    halibut: 'Halibut',
    lingcod: 'Lingcod',
    rockfish: 'Rockfish',
    northern_pike: 'Northern Pike',
    burbot: 'Burbot',
    steelhead: 'Steelhead',
  };
  return names[species] || species;
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate coordinates are in Alaska
 */
export function isInAlaska(coords: Coordinates): boolean {
  // Rough bounding box for Alaska
  return (
    coords.latitude >= 51.2 &&
    coords.latitude <= 71.5 &&
    coords.longitude >= -179.9 &&
    coords.longitude <= -129.0
  );
}

// ============================================
// Array Utilities
// ============================================

/**
 * Group array by key
 */
export function groupBy<T>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const value = String(item[key]);
    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by date field
 */
export function sortByDate<T extends { [key: string]: any }>(
  array: T[],
  dateField: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]).getTime();
    const dateB = new Date(b[dateField]).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Remove duplicates from array by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// ============================================
// Fishing-specific Utilities
// ============================================

/**
 * Calculate escapement percentage
 */
export function calculateEscapementPercent(
  current: number,
  goal: number
): number {
  if (goal <= 0) return 0;
  return Math.round((current / goal) * 100);
}

/**
 * Get run strength description
 */
export function getRunStrength(
  current: number,
  average: number
): 'weak' | 'below_average' | 'average' | 'above_average' | 'strong' {
  const ratio = current / average;
  if (ratio < 0.5) return 'weak';
  if (ratio < 0.85) return 'below_average';
  if (ratio < 1.15) return 'average';
  if (ratio < 1.5) return 'above_average';
  return 'strong';
}

/**
 * Get fishing conditions color
 */
export function getConditionsColor(
  conditions: 'poor' | 'fair' | 'good' | 'excellent'
): string {
  const colors = {
    poor: '#E74C3C',
    fair: '#F39C12',
    good: '#2ECC71',
    excellent: '#3498DB',
  };
  return colors[conditions];
}

/**
 * Get moon phase name
 */
export function getMoonPhase(illumination: number): string {
  if (illumination < 0.03) return 'New Moon';
  if (illumination < 0.25) return 'Waxing Crescent';
  if (illumination < 0.27) return 'First Quarter';
  if (illumination < 0.48) return 'Waxing Gibbous';
  if (illumination < 0.52) return 'Full Moon';
  if (illumination < 0.73) return 'Waning Gibbous';
  if (illumination < 0.77) return 'Last Quarter';
  if (illumination < 0.97) return 'Waning Crescent';
  return 'New Moon';
}
