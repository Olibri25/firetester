// AK FISH Database Seed Script

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Seed fish counting stations
  const stations = [
    {
      id: 'kenai-sonar',
      name: 'Kenai River Sonar',
      type: 'SONAR' as const,
      river: 'Kenai River',
      region: 'Southcentral',
      latitude: 60.5042,
      longitude: -151.2732,
      species: ['king_salmon', 'sockeye_salmon'],
      isActive: true,
    },
    {
      id: 'kasilof-sonar',
      name: 'Kasilof River Sonar',
      type: 'SONAR' as const,
      river: 'Kasilof River',
      region: 'Southcentral',
      latitude: 60.3388,
      longitude: -151.2789,
      species: ['king_salmon', 'sockeye_salmon'],
      isActive: true,
    },
    {
      id: 'russian-weir',
      name: 'Russian River Weir',
      type: 'WEIR' as const,
      river: 'Russian River',
      region: 'Southcentral',
      latitude: 60.4833,
      longitude: -149.9500,
      species: ['sockeye_salmon'],
      isActive: true,
    },
    {
      id: 'anchor-weir',
      name: 'Anchor River Weir',
      type: 'WEIR' as const,
      river: 'Anchor River',
      region: 'Southcentral',
      latitude: 59.7694,
      longitude: -151.8317,
      species: ['king_salmon', 'coho_salmon'],
      isActive: true,
    },
    {
      id: 'copper-sonar',
      name: 'Miles Lake Sonar (Copper River)',
      type: 'SONAR' as const,
      river: 'Copper River',
      region: 'Southcentral',
      latitude: 60.6950,
      longitude: -144.6567,
      species: ['king_salmon', 'sockeye_salmon'],
      isActive: true,
    },
    {
      id: 'deshka-weir',
      name: 'Deshka River Weir',
      type: 'WEIR' as const,
      river: 'Deshka River',
      region: 'Southcentral',
      latitude: 61.7883,
      longitude: -150.2583,
      species: ['king_salmon'],
      isActive: true,
    },
    {
      id: 'wood-tower',
      name: 'Wood River Tower',
      type: 'TOWER' as const,
      river: 'Wood River',
      region: 'Bristol Bay',
      latitude: 59.0500,
      longitude: -158.5167,
      species: ['sockeye_salmon'],
      isActive: true,
    },
    {
      id: 'naknek-tower',
      name: 'Naknek River Tower',
      type: 'TOWER' as const,
      river: 'Naknek River',
      region: 'Bristol Bay',
      latitude: 58.7167,
      longitude: -156.9667,
      species: ['sockeye_salmon'],
      isActive: true,
    },
  ];

  for (const station of stations) {
    await prisma.fishCountStation.upsert({
      where: { id: station.id },
      update: station,
      create: station,
    });
  }
  console.log(`Seeded ${stations.length} fish counting stations`);

  // Seed sample lakes
  const lakes = [
    {
      id: 'big-lake',
      name: 'Big Lake',
      latitude: 61.5256,
      longitude: -149.9539,
      region: 'Southcentral',
      type: 'LAKE' as const,
      surfaceArea: 3500,
      maxDepth: 40,
      elevation: 148,
      accessTypes: ['road', 'boat'],
      accessDescription: 'Public boat launch available at Big Lake South State Recreation Site.',
      boatLaunchAvailable: true,
      bathymetryAvailable: true,
    },
    {
      id: 'finger-lake',
      name: 'Finger Lake',
      latitude: 61.6061,
      longitude: -149.2689,
      region: 'Southcentral',
      type: 'LAKE' as const,
      surfaceArea: 350,
      maxDepth: 60,
      elevation: 2300,
      accessTypes: ['road', 'walk_in'],
      accessDescription: 'Access via Finger Lake State Recreation Site.',
      boatLaunchAvailable: false,
      bathymetryAvailable: true,
    },
    {
      id: 'kenai-lake',
      name: 'Kenai Lake',
      latitude: 60.4258,
      longitude: -149.6111,
      region: 'Southcentral',
      type: 'LAKE' as const,
      surfaceArea: 22000,
      maxDepth: 573,
      elevation: 436,
      accessTypes: ['road', 'boat'],
      accessDescription: 'Multiple boat launches available. Primary access at Primrose Landing.',
      boatLaunchAvailable: true,
      bathymetryAvailable: true,
    },
    {
      id: 'quartz-lake',
      name: 'Quartz Lake',
      latitude: 64.2006,
      longitude: -145.8178,
      region: 'Interior',
      type: 'LAKE' as const,
      surfaceArea: 1500,
      maxDepth: 40,
      elevation: 1095,
      accessTypes: ['road', 'boat'],
      accessDescription: 'Quartz Lake State Recreation Area provides boat launch access.',
      boatLaunchAvailable: true,
      bathymetryAvailable: true,
    },
  ];

  for (const lake of lakes) {
    await prisma.lake.upsert({
      where: { id: lake.id },
      update: lake,
      create: lake,
    });

    // Add species to lakes
    const lakeSpecies = [
      { species: 'rainbow_trout', abundance: 'COMMON' as const },
      { species: 'dolly_varden', abundance: 'COMMON' as const },
    ];

    for (const sp of lakeSpecies) {
      await prisma.lakeSpecies.upsert({
        where: {
          lakeId_species: {
            lakeId: lake.id,
            species: sp.species,
          },
        },
        update: sp,
        create: {
          lakeId: lake.id,
          ...sp,
        },
      });
    }
  }
  console.log(`Seeded ${lakes.length} lakes`);

  // Seed sample regulations
  const regulations = [
    {
      id: 'kenai-king-reg',
      area: 'Kenai Peninsula',
      waterBody: 'Kenai River',
      species: 'king_salmon',
      bagLimit: 1,
      sizeLimitMin: 20,
      gearRestrictions: ['single hook only', 'no bait'],
      seasonOpen: new Date('2024-05-15'),
      seasonClose: new Date('2024-07-31'),
      specialConditions: ['Tuesday closures in effect'],
      plainEnglishSummary: 'You can keep 1 king salmon per day on the Kenai River. Single hooks only, no bait. Closed on Tuesdays.',
    },
    {
      id: 'russian-sockeye-reg',
      area: 'Kenai Peninsula',
      waterBody: 'Russian River',
      species: 'sockeye_salmon',
      bagLimit: 3,
      gearRestrictions: ['flies only', 'single hook'],
      seasonOpen: new Date('2024-06-11'),
      seasonClose: new Date('2024-08-20'),
      specialConditions: ['First run: June 11 - July 14', 'Second run: July 15 - August 20'],
      plainEnglishSummary: 'You can keep 3 sockeye salmon per day on the Russian River. Flies only with single hooks. Two distinct runs available.',
    },
  ];

  for (const reg of regulations) {
    await prisma.regulation.upsert({
      where: { id: reg.id },
      update: reg,
      create: reg,
    });
  }
  console.log(`Seeded ${regulations.length} regulations`);

  // Generate sample fish counts
  console.log('Generating sample fish count data...');
  const today = new Date();

  for (const station of stations.slice(0, 4)) {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const species = station.species[0];
      const dailyCount = Math.floor(Math.random() * 5000) + 500;
      const baseCumulative = 50000 + Math.floor(Math.random() * 20000);

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
          cumulativeCount: baseCumulative + dailyCount * (30 - i),
        },
        create: {
          stationId: station.id,
          date,
          timestamp: new Date(),
          species,
          dailyCount,
          cumulativeCount: baseCumulative + dailyCount * (30 - i),
          escapementGoal: 100000,
          percentOfGoal: ((baseCumulative + dailyCount * (30 - i)) / 100000) * 100,
        },
      });
    }
  }
  console.log('Fish count data generated');

  // Seed sample emergency orders
  const emergencyOrders = [
    {
      externalId: 'eo-2024-demo-001',
      type: 'EMERGENCY_ORDER' as const,
      action: 'CLOSURE',
      title: 'Sample: Kenai River King Salmon Sport Fishing Closure',
      summary: 'King salmon fishing closed on the Kenai River from RM 0 to Skilak Lake.',
      fullText: 'Due to low projected escapement, king salmon fishing on the Kenai River is closed effective immediately. This closure affects all sport fishing for king salmon from river mile 0 to Skilak Lake outlet.',
      effectiveDate: new Date(),
      affectedAreas: ['Kenai River', 'Soldotna'],
      affectedSpecies: ['king_salmon'],
      sourceUrl: 'https://example.com/eo/demo-001',
      publishedAt: new Date(),
      isActive: true,
    },
    {
      externalId: 'eo-2024-demo-002',
      type: 'NEWS_RELEASE' as const,
      action: 'BAG_LIMIT_CHANGE',
      title: 'Sample: Russian River Sockeye Bag Limit Increased',
      summary: 'Strong sockeye returns allow for increased bag limits.',
      fullText: 'Due to exceptionally strong sockeye salmon returns, the daily bag and possession limit for sockeye salmon on the Russian River is increased from 3 to 6 fish effective immediately.',
      effectiveDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      affectedAreas: ['Russian River'],
      affectedSpecies: ['sockeye_salmon'],
      sourceUrl: 'https://example.com/eo/demo-002',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ];

  for (const order of emergencyOrders) {
    await prisma.emergencyOrder.upsert({
      where: { externalId: order.externalId },
      update: order,
      create: order,
    });
  }
  console.log(`Seeded ${emergencyOrders.length} emergency orders`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
