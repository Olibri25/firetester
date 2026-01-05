// AK FISH - ADFG Emergency Orders Scraper

import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { config } from '../config';
import { redis } from '../utils/redis';

interface ScrapedEmergencyOrder {
  externalId: string;
  type: 'EMERGENCY_ORDER' | 'NEWS_RELEASE' | 'REGULATION_CHANGE';
  action: string;
  title: string;
  summary: string;
  fullText: string;
  effectiveDate: Date;
  expirationDate?: Date;
  affectedAreas: string[];
  affectedSpecies: string[];
  sourceUrl: string;
  publishedAt: Date;
}

export class EmergencyOrderScraper {
  private baseUrl = config.adfg.emergencyOrdersUrl;

  async scrapeEmergencyOrders(): Promise<void> {
    logger.info('Starting emergency orders scrape...');

    const syncLog = await prisma.dataSyncLog.create({
      data: {
        source: 'emergency_orders',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      const orders = await this.scrapeOrdersList();
      let newOrders = 0;

      for (const order of orders) {
        // Check if order already exists
        const existing = await prisma.emergencyOrder.findUnique({
          where: { externalId: order.externalId },
        });

        if (!existing) {
          await prisma.emergencyOrder.create({
            data: order,
          });
          newOrders++;

          // Send push notifications for new orders
          await this.notifyUsers(order);
        } else {
          // Update if content changed
          await prisma.emergencyOrder.update({
            where: { externalId: order.externalId },
            data: {
              title: order.title,
              summary: order.summary,
              fullText: order.fullText,
              isActive: this.isOrderActive(order),
            },
          });
        }
      }

      // Invalidate cache
      await redis.delPattern('emergency-orders:*');

      await prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          recordsProcessed: orders.length,
          completedAt: new Date(),
        },
      });

      logger.info(`Emergency orders scrape completed. ${newOrders} new orders.`);
    } catch (error) {
      logger.error('Emergency orders scrape failed:', error);

      await prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
    }
  }

  async scrapeOrdersList(): Promise<ScrapedEmergencyOrder[]> {
    const orders: ScrapedEmergencyOrder[] = [];

    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AK-FISH-App/1.0 (Data Collection)',
        },
      });

      const $ = cheerio.load(response.data);

      // Parse emergency orders from the page
      // Note: Actual selectors depend on ADFG website structure
      $('.emergency-order-item, .eo-listing tr').each((index, element) => {
        const $el = $(element);

        // Extract order details
        const title = $el.find('.eo-title, td:first-child a').text().trim();
        const link = $el.find('a').attr('href') || '';
        const dateStr = $el.find('.eo-date, td:nth-child(2)').text().trim();
        const areaStr = $el.find('.eo-area, td:nth-child(3)').text().trim();

        if (!title || !link) return;

        // Generate external ID from link
        const externalId = this.extractExternalId(link);

        orders.push({
          externalId,
          type: this.determineOrderType(title),
          action: this.determineAction(title),
          title,
          summary: title, // Will be updated when we fetch full details
          fullText: '',
          effectiveDate: this.parseDate(dateStr),
          affectedAreas: this.parseAreas(areaStr),
          affectedSpecies: this.parseSpecies(title + ' ' + areaStr),
          sourceUrl: link.startsWith('http') ? link : `https://www.adfg.alaska.gov${link}`,
          publishedAt: this.parseDate(dateStr),
        });
      });

      // Fetch full details for each order
      for (const order of orders.slice(0, 20)) { // Limit to recent 20
        try {
          const details = await this.scrapeOrderDetails(order.sourceUrl);
          order.fullText = details.fullText;
          order.summary = details.summary || order.title;
          if (details.effectiveDate) order.effectiveDate = details.effectiveDate;
          if (details.expirationDate) order.expirationDate = details.expirationDate;
        } catch (e) {
          logger.warn(`Failed to fetch details for order ${order.externalId}`);
        }
      }
    } catch (error) {
      logger.error('Failed to scrape emergency orders list:', error);
    }

    return orders;
  }

  async scrapeOrderDetails(url: string): Promise<{
    fullText: string;
    summary?: string;
    effectiveDate?: Date;
    expirationDate?: Date;
  }> {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'AK-FISH-App/1.0 (Data Collection)',
      },
    });

    const $ = cheerio.load(response.data);

    // Extract full text content
    const fullText = $('.eo-content, .emergency-order-text, article').text().trim();
    const summary = $('.eo-summary, .lead, p:first-of-type').text().trim();

    // Try to extract dates from content
    let effectiveDate: Date | undefined;
    let expirationDate: Date | undefined;

    const effectiveMatch = fullText.match(/effective\s+(?:date|from)?\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4})/i);
    if (effectiveMatch) {
      effectiveDate = new Date(effectiveMatch[1]);
    }

    const expirationMatch = fullText.match(/(?:expires?|until|through)\s*:?\s*([A-Za-z]+\s+\d{1,2},?\s*\d{4})/i);
    if (expirationMatch) {
      expirationDate = new Date(expirationMatch[1]);
    }

    return {
      fullText: fullText.slice(0, 10000), // Limit length
      summary: summary.slice(0, 500),
      effectiveDate,
      expirationDate,
    };
  }

  private extractExternalId(url: string): string {
    // Extract ID from URL patterns like /eo/123 or ?id=123
    const match = url.match(/(?:eo|id)[=/](\d+)/i) || url.match(/(\d{4}-\d{2,4})/);
    return match ? match[1] : `eo-${Date.now()}`;
  }

  private determineOrderType(title: string): 'EMERGENCY_ORDER' | 'NEWS_RELEASE' | 'REGULATION_CHANGE' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('news release')) return 'NEWS_RELEASE';
    if (lowerTitle.includes('regulation')) return 'REGULATION_CHANGE';
    return 'EMERGENCY_ORDER';
  }

  private determineAction(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('closed') || lowerTitle.includes('closure')) return 'CLOSURE';
    if (lowerTitle.includes('open')) return 'OPENING';
    if (lowerTitle.includes('bag limit')) return 'BAG_LIMIT_CHANGE';
    if (lowerTitle.includes('gear')) return 'GEAR_RESTRICTION';
    if (lowerTitle.includes('size')) return 'SIZE_LIMIT_CHANGE';
    if (lowerTitle.includes('extend')) return 'SEASON_EXTENSION';
    return 'REGULATION_CHANGE';
  }

  private parseAreas(areaStr: string): string[] {
    // Parse area string into array
    const areas: string[] = [];

    const knownAreas = [
      'Kenai', 'Kasilof', 'Anchor', 'Russian', 'Copper', 'Susitna',
      'Bristol Bay', 'Kodiak', 'Southeast', 'Prince William Sound',
      'Cook Inlet', 'Yukon', 'Kuskokwim', 'Norton Sound',
    ];

    for (const area of knownAreas) {
      if (areaStr.toLowerCase().includes(area.toLowerCase())) {
        areas.push(area);
      }
    }

    return areas.length > 0 ? areas : [areaStr];
  }

  private parseSpecies(text: string): string[] {
    const species: string[] = [];
    const lowerText = text.toLowerCase();

    const speciesMap: Record<string, string> = {
      'king': 'king_salmon',
      'chinook': 'king_salmon',
      'sockeye': 'sockeye_salmon',
      'red': 'sockeye_salmon',
      'coho': 'coho_salmon',
      'silver': 'coho_salmon',
      'pink': 'pink_salmon',
      'humpy': 'pink_salmon',
      'chum': 'chum_salmon',
      'rainbow': 'rainbow_trout',
      'dolly': 'dolly_varden',
      'halibut': 'halibut',
    };

    for (const [keyword, speciesCode] of Object.entries(speciesMap)) {
      if (lowerText.includes(keyword) && !species.includes(speciesCode)) {
        species.push(speciesCode);
      }
    }

    return species;
  }

  private parseDate(dateStr: string): Date {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private isOrderActive(order: ScrapedEmergencyOrder): boolean {
    const now = new Date();
    if (order.expirationDate && order.expirationDate < now) {
      return false;
    }
    return true;
  }

  private async notifyUsers(order: ScrapedEmergencyOrder): Promise<void> {
    // Find users who have notifications enabled and are interested in affected areas/species
    const users = await prisma.user.findMany({
      where: {
        preferences: {
          path: ['notifications', 'emergencyOrders'],
          equals: true,
        },
      },
      include: {
        favoriteLakes: true,
        favoriteStations: true,
      },
    });

    // In a full implementation, send push notifications via Firebase
    logger.info(`Would notify ${users.length} users about emergency order: ${order.title}`);
  }

  // Seed sample emergency orders for demo
  async seedSampleOrders(): Promise<void> {
    const sampleOrders = [
      {
        externalId: 'eo-2024-001',
        type: 'EMERGENCY_ORDER' as const,
        action: 'CLOSURE',
        title: 'Kenai River King Salmon Emergency Closure',
        summary: 'King salmon fishing closed on the Kenai River due to low run numbers.',
        fullText: 'Effective immediately, all king salmon fishing on the Kenai River from the mouth to Skilak Lake is closed. This closure is in effect until further notice due to projected escapement being below the sustainable escapement goal.',
        effectiveDate: new Date(),
        affectedAreas: ['Kenai', 'Soldotna'],
        affectedSpecies: ['king_salmon'],
        sourceUrl: 'https://www.adfg.alaska.gov/sf/EONR/sample',
        publishedAt: new Date(),
        isActive: true,
      },
      {
        externalId: 'eo-2024-002',
        type: 'EMERGENCY_ORDER' as const,
        action: 'BAG_LIMIT_CHANGE',
        title: 'Russian River Sockeye Bag Limit Increase',
        summary: 'Daily bag limit increased to 6 sockeye salmon on Russian River.',
        fullText: 'Due to strong sockeye returns, the daily bag and possession limit for sockeye salmon on the Russian River is increased from 3 to 6 fish. This order is effective through August 15.',
        effectiveDate: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        affectedAreas: ['Russian River'],
        affectedSpecies: ['sockeye_salmon'],
        sourceUrl: 'https://www.adfg.alaska.gov/sf/EONR/sample2',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ];

    for (const order of sampleOrders) {
      await prisma.emergencyOrder.upsert({
        where: { externalId: order.externalId },
        update: order,
        create: order,
      });
    }

    logger.info('Sample emergency orders seeded');
  }
}

export const emergencyOrderScraper = new EmergencyOrderScraper();
