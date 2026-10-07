import { PrismaClient } from "../prisma-clients/public/index.js";

const prisma = new PrismaClient();

const PLATES = [
  "01A123BC", "01B456DE", "30C789FG", "40D111HI", "50E222JK",
  "60F333LM", "70G444NO", "80H555PQ", "90I666RS", "10J777TU",
];

const TEST_PHOTOS = [
  "plate_1774434914452.jpg",
  "plate_1774435382172.jpg",
  "plate_1774435397151.jpg",
  "plate_1774435600773.jpg",
];

function todayAt(hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
  return d;
}

async function run() {
  console.log("🌱 Seeding test passes for today...");

  let location = await prisma.locations.findFirst({ where: { status: true } });
  if (!location) {
    location = await prisma.locations.create({
      data: {
        name: "Тестовая Парковка",
        status: true,
        total_spots: 100,
        telegram_chat_ids: [],
        latitude: 41.00373,
        longitude: 71.67025,
      },
    });
    console.log(`  ✓ Location created: ${location.name} (id=${location.id})`);
  } else {
    console.log(`  · Using location: ${location.name} (id=${location.id})`);
  }

  let camIn = await prisma.anpr_cameras.findFirst({
    where: { location_id: location.id, direction: "entry" },
  });
  if (!camIn) {
    camIn = await prisma.anpr_cameras.create({
      data: {
        name: "Тест Въезд",
        location_id: location.id,
        camera_ip: "192.168.200.1",
        direction: "entry",
        status: true,
      },
    });
    console.log(`  ✓ Entry camera created (id=${camIn.id})`);
  }

  let camOut = await prisma.anpr_cameras.findFirst({
    where: { location_id: location.id, direction: "exit" },
  });
  if (!camOut) {
    camOut = await prisma.anpr_cameras.create({
      data: {
        name: "Тест Выезд",
        location_id: location.id,
        camera_ip: "192.168.200.2",
        direction: "exit",
        status: true,
      },
    });
    console.log(`  ✓ Exit camera created (id=${camOut.id})`);
  }

  const passes = [
    { plate: PLATES[0], dir: "entry", hour: 7, min: 15 },
    { plate: PLATES[1], dir: "entry", hour: 7, min: 42 },
    { plate: PLATES[2], dir: "entry", hour: 8, min: 5 },
    { plate: PLATES[0], dir: "exit",  hour: 8, min: 30 },
    { plate: PLATES[3], dir: "entry", hour: 9, min: 10 },
    { plate: PLATES[4], dir: "entry", hour: 9, min: 55 },
    { plate: PLATES[1], dir: "exit",  hour: 10, min: 20 },
    { plate: PLATES[5], dir: "entry", hour: 11, min: 0 },
    { plate: PLATES[2], dir: "exit",  hour: 11, min: 45 },
    { plate: PLATES[6], dir: "entry", hour: 12, min: 30 },
    { plate: PLATES[3], dir: "exit",  hour: 13, min: 15 },
    { plate: PLATES[7], dir: "entry", hour: 14, min: 0 },
    { plate: PLATES[4], dir: "exit",  hour: 14, min: 40 },
    { plate: PLATES[8], dir: "entry", hour: 15, min: 20 },
    { plate: PLATES[5], dir: "exit",  hour: 16, min: 10 },
    { plate: PLATES[9], dir: "entry", hour: 16, min: 55 },
    { plate: PLATES[6], dir: "exit",  hour: 17, min: 30 },
    { plate: PLATES[7], dir: "exit",  hour: 18, min: 0 },
    { plate: PLATES[8], dir: "exit",  hour: 18, min: 45 },
    { plate: PLATES[9], dir: "exit",  hour: 19, min: 20 },
  ];

  const data = passes.map((p, i) => {
    const cam = p.dir === "entry" ? camIn : camOut;
    const date = todayAt(p.hour, p.min);
    return {
      location_id: location.id,
      camera_id: cam.id,
      plate_number: p.plate,
      direction: p.dir,
      photo: TEST_PHOTOS[i % TEST_PHOTOS.length],
      date,
      created_at: date,
    };
  });

  const result = await prisma.vehicle_passes.createMany({ data });
  console.log(`  ✓ ${result.count} passes created for today`);

  await prisma.$disconnect();
  console.log("✅ Done.");
}

run().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
  process.exit(1);
});
