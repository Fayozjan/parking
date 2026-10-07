import { PrismaClient } from "../prisma-clients/public/index.js";

const prisma = new PrismaClient();

const TEST_PHOTOS = [
  "plate_1774434914452.jpg",
  "plate_1774435382172.jpg",
  "plate_1774435397151.jpg",
  "plate_1774435600773.jpg",
];

const PLATES = [
  "01A123BC", "01B456DE", "01C789FG", "30A111HI", "30B222JK",
  "40C333LM", "40D444NO", "50E555PQ", "50F666RS", "60G777TU",
  "10H888VW", "10I999XY", "20J000ZA", "20K100BC", "70L200DE",
  "70M300FG", "80N400HI", "80O500JK", "90P600LM", "90Q700NO",
  "01R800PQ", "01S900RS", "30T010TU", "30U020VW", "40V030XY",
  "50W040ZA", "60X050BC", "70Y060DE", "80Z070FG", "90A080HI",
];

const PARKING_NAMES = [
  "Паркинг Бобур майдони",
  "Паркинг Навоий кўчаси",
  "Паркинг Истиқлол",
  "Паркинг Хамза",
  "Паркинг Наманган Марказ",
  "Паркинг Чорсу",
  "Паркинг Дўстлик",
  "Паркинг Ипак Йўли",
  "Паркинг Юлдуз",
  "Паркинг Жомий",
  "Паркинг Аэропорт",
  "Паркинг Ўрда",
  "Паркинг Тошкент кўчаси",
  "Паркинг Янги Наманган",
  "Паркинг Саноат",
];

const PARKING_COUNT = PARKING_NAMES.length;
const EVENTS_PER_DAY = 200;

const CENTER_LAT = 41.00373;
const CENTER_LON = 71.67025;

function randomLocation() {
  const distanceM = 2000 + Math.random() * 1000; // 2000–3000 m
  const angle = Math.random() * 2 * Math.PI;
  const dLat = (distanceM * Math.cos(angle)) / 111000;
  const dLon = (distanceM * Math.sin(angle)) / (111000 * Math.cos((CENTER_LAT * Math.PI) / 180));
  return {
    latitude: CENTER_LAT + dLat,
    longitude: CENTER_LON + dLon,
  };
}

function getDaysFromMonthStart() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = [];
  const cur = new Date(start);
  while (cur <= now) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function randomTimeOnDay(day) {
  const d = new Date(day);
  d.setHours(Math.floor(Math.random() * 24));
  d.setMinutes(Math.floor(Math.random() * 60));
  d.setSeconds(Math.floor(Math.random() * 60));
  d.setMilliseconds(0);
  return d;
}

function hexByte(n) {
  return n.toString(16).padStart(2, "0").toUpperCase();
}

async function getOrCreateParking(i, lat, lon) {
  const name = PARKING_NAMES[i - 1];
  let location = await prisma.locations.findFirst({ where: { name } });
  if (!location) {
    location = await prisma.locations.create({
      data: { name, status: true, total_spots: 50 + Math.floor(Math.random() * 101), telegram_chat_ids: [], latitude: lat, longitude: lon },
    });
    console.log(`  ✓ Location created: ${name} (id=${location.id})`);
  } else {
    console.log(`  · Location exists: ${name} (id=${location.id})`);
  }
  return location;
}

async function getOrCreateCamera(location, direction, ip, mac, label) {
  let cam = await prisma.anpr_cameras.findFirst({ where: { camera_ip: ip } });
  if (!cam) {
    cam = await prisma.anpr_cameras.create({
      data: {
        name: label,
        location_id: location.id,
        camera_ip: ip,
        mac_address: mac,
        direction,
        status: true,
      },
    });
    console.log(`    ✓ Camera ${label} created (id=${cam.id})`);
  } else {
    console.log(`    · Camera ${label} exists (id=${cam.id})`);
  }
  return cam;
}

async function getOrCreateTariff(userId) {
  const name = "Тестовый тариф 5000";
  let tariff = await prisma.location_tariffs.findFirst({ where: { name } });
  if (!tariff) {
    tariff = await prisma.location_tariffs.create({
      data: {
        name,
        price_type: "flat",
        base_price: 5000,
        effective_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        is_active: true,
        added_by: userId,
      },
    });
    console.log(`  ✓ Tariff created: ${name} (id=${tariff.id})`);
  } else {
    console.log(`  · Tariff exists: ${name} (id=${tariff.id})`);
  }
  return tariff;
}

async function run() {
  const days = getDaysFromMonthStart();
  console.log(`🌱 Seeding ${PARKING_COUNT} parkings × ~100–300 events/day × ${days.length} days`);
  console.log(`   Date range: ${days[0].toDateString()} → ${days[days.length - 1].toDateString()}`);

  const adminUser = await prisma.users.findFirst({ where: { status: true } });
  if (!adminUser) throw new Error("No active user found. Run seed.js first.");
  console.log(`  · Using user id=${adminUser.id} (${adminUser.username}) for tariff`);

  const tariff = await getOrCreateTariff(adminUser.id);

  let totalCreated = 0;

  for (let i = 1; i <= PARKING_COUNT; i++) {
    const { latitude, longitude } = randomLocation();
    const parking = await getOrCreateParking(i, latitude, longitude);

    const inIp = `192.168.10${Math.floor((i - 1) / 10)}.${((i - 1) * 2 + 1) % 256}`;
    const outIp = `192.168.10${Math.floor((i - 1) / 10)}.${((i - 1) * 2 + 2) % 256}`;
    const inMac = `AA:BB:CC:${hexByte(i)}:00:01`;
    const outMac = `AA:BB:CC:${hexByte(i)}:00:02`;

    const camIn = await getOrCreateCamera(parking, "entry", inIp, inMac, `Въезд ${i}`);
    const camOut = await getOrCreateCamera(parking, "exit", outIp, outMac, `Выезд ${i}`);

    const existingTariffHistory = await prisma.location_tariff_history.findFirst({
      where: { location_id: parking.id, tariff_id: tariff.id },
    });
    if (!existingTariffHistory) {
      await prisma.location_tariff_history.create({
        data: {
          location_id: parking.id,
          tariff_id: tariff.id,
          assigned_at: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          added_by: adminUser.id,
        },
      });
      console.log(`    ✓ Tariff 5000 assigned to location ${i}`);
    }

    const passes = [];
    for (const day of days) {
      const dayCount = 100 + Math.floor(Math.random() * 201); // 100–300 per day
      for (let e = 0; e < dayCount; e++) {
        const isIn = e % 2 === 0;
        const cam = isIn ? camIn : camOut;
        const date = randomTimeOnDay(day);
        passes.push({
          location_id: parking.id,
          camera_id: cam.id,
          plate_number: PLATES[(i * EVENTS_PER_DAY + e) % PLATES.length],
          direction: isIn ? "entry" : "exit",
          photo: TEST_PHOTOS[(i * EVENTS_PER_DAY + e) % TEST_PHOTOS.length],
          date,
          created_at: date,
        });
      }
    }

    const result = await prisma.vehicle_passes.createMany({ data: passes });
    totalCreated += result.count;
    console.log(`  ✓ Parking ${i}: ${result.count} passes inserted`);
  }

  await prisma.$disconnect();
  console.log(`✅ Done. Total passes created: ${totalCreated}`);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
  process.exit(1);
});
