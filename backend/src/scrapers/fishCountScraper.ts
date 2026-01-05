// AK FISH - ADFG Fish Count Scraper

import axios from 'axios';
import * as cheerio from 'cheerio';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';
import { config } from '../config';

interface ScrapedFishCount {
  stationName: string;
  date: Date;
  species: string;
  dailyCount: number;
  cumulativeCount: number;
  escapementGoal?: number;
}

export class FishCountScraper {
  private baseUrl = config.adfg.fishCountsUrl;

  async scrapeAllStations(): Promise<void> {
    logger.info('Starting fish count scrape...');

    const syncLog = await prisma.dataSyncLog.create({
      data: {
        source: 'fish_counts',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      // Get list of active stations
      const stations = await prisma.fishCountStation.findMany({
        where: { isActive: true },
      });

      let totalRecords = 0;

      for (const station of stations) {
        try {
          const counts = await this.scrapeStation(station.id, station.dataUrl || `${this.baseUrl}?PRIOR=0`);
          totalRecords += counts.length;

          // Upsert counts
          for (const count of counts) {
            await prisma.fishCount.upsert({
              where: {
                stationId_date_species: {
                  stationId: station.id,
                  date: count.date,
                  species: count.species,
                },
              },
              update: {
                dailyCount: count.dailyCount,
                cumulativeCount: count.cumulativeCount,
                timestamp: new Date(),
              },
              create: {
                stationId: station.id,
                date: count.date,
                timestamp: new Date(),
                species: count.species,
                dailyCount: count.dailyCount,
                cumulativeCount: count.cumulativeCount,
                escapementGoal: count.escapementGoal,
                percentOfGoal: count.escapementGoal
                  ? (count.cumulativeCount / count.escapementGoal) * 100
                  : undefined,
              },
            });
          }

          logger.info(`Scraped ${counts.length} counts for ${station.name}`);
        } catch (error) {
          logger.error(`Error scraping station ${station.name}:`, error);
        }
      }

      await prisma.dataSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'COMPLETED',
          recordsProcessed: totalRecords,
          completedAt: new Date(),
        },
      });

      logger.info(`Fish count scrape completed. ${totalRecords} records processed.`);
    } catch (error) {
      logger.error('Fish count scrape failed:', error);

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

  async scrapeStation(stationId: string, url: string): Promise<ScrapedFishCount[]> {
    const counts: ScrapedFishCount[] = [];

    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'AK-FISH-App/1.0 (Data Collection)',
        },
      });

      const $ = cheerio.load(response.data);

      // Parse the fish count table
      // Note: Actual parsing logic depends on ADFG website structure
      // This is a template that would need adjustment based on actual HTML

      $('table.fishcount-data tr').each((index, row) => {
        if (index === 0) return; // Skip header

        const cells = $(row).find('td');
        if (cells.length < 4) return;

        const dateStr = $(cells[0]).text().trim();
        const species = $(cells[1]).text().trim().toLowerCase().replace(/\s+/g, '_');
        const dailyCount = parseInt($(cells[2]).text().replace(/,/g, ''), 10);
        const cumulativeCount = parseInt($(cells[3]).text().replace(/,/g, ''), 10);

        if (isNaN(dailyCount) || isNaN(cumulativeCount)) return;

        counts.push({
          stationName: stationId,
          date: this.parseDate(dateStr),
          species,
          dailyCount,
          cumulativeCount,
        });
      });

      // Alternative: Parse JSON data if available
      const scriptContent = $('script:contains("fishCountData")').html();
      if (scriptContent) {
        const jsonMatch = scriptContent.match(/fishCountData\s*=\s*(\[[\s\S]*?\]);/);
        if (jsonMatch) {
          try {
            const jsonData = JSON.parse(jsonMatch[1]);
            for (const item of jsonData) {
              counts.push({
                stationName: stationId,
                date: new Date(item.date),
                species: item.species.toLowerCase().replace(/\s+/g, '_'),
                dailyCount: item.daily || 0,
                cumulativeCount: item.cumulative || 0,
                escapementGoal: item.goal,
              });
            }
          } catch (e) {
            logger.warn('Failed to parse embedded JSON data');
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to scrape station ${stationId}:`, error);
    }

    return counts;
  }

  private parseDate(dateStr: string): Date {
    // Handle various date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/, // Month DD, YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        } else if (format === formats[1]) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else if (format === formats[2]) {
          return new Date(dateStr);
        }
      }
    }

    // Default to current date if parsing fails
    return new Date();
  }

  // Generate sample data for testing/demo purposes
  async seedSampleData(): Promise<void> {
    logger.info('Seeding sample fish count data...');

    const stations = await prisma.fishCountStation.findMany();

    for (const station of stations) {
      const currentDate = new Date();
      const species = station.species[0] || 'sockeye_salmon';

      // Generate 30 days of sample data
      for (let i = 0; i < 30; i++) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);

        const dailyCount = Math.floor(Math.random() * 5000) + 500;
        const cumulativeCount = dailyCount * (30 - i);

        await prisma.fishCount.upsert({
          where: {
            stationId_date_species: {
              stationId: station.id,
              date,
              species,
            },
          },
          update: {
            dailyCount,
            cumulativeCount,
          },
          create: {
            stationId: station.id,
            date,
            timestamp: new Date(),
            species,
            dailyCount,
            cumulativeCount,
            escapementGoal: 100000,
            percentOfGoal: (cumulativeCount / 100000) * 100,
          },
        });
      }
    }

    logger.info('Sample fish count data seeded successfully');
  }
}

export const fishCountScraper = new FishCountScraper();
