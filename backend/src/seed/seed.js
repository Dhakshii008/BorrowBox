import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(rootDir, '.env') });

import connectDB from '../config/db.js';
import { User, Item, BorrowRequest, Transaction, Notification, Review, Report } from '../models/index.js';

const uploadsDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

const svgPlaceholder = (label, subtitle, bg, fg = '#FFFFFF') => {
  const clean = String(label).replace(/[^a-zA-Z0-9 ]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${bg}"/>
  <rect x="40" y="40" width="720" height="520" rx="24" fill="none" stroke="${fg}" stroke-opacity="0.35" stroke-width="3"/>
  <rect x="300" y="180" width="200" height="150" rx="18" fill="${fg}" fill-opacity="0.9"/>
  <rect x="340" y="220" width="120" height="14" rx="7" fill="${bg}"/>
  <rect x="340" y="248" width="90" height="14" rx="7" fill="${bg}" fill-opacity="0.7"/>
  <text x="400" y="430" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700" fill="${fg}" text-anchor="middle">${clean}</text>
  <text x="400" y="475" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="${fg}" fill-opacity="0.75" text-anchor="middle">${subtitle}</text>
  <text x="400" y="555" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="${fg}" fill-opacity="0.55" text-anchor="middle">BorrowBox - free sharing</text>
</svg>`;
  return svg;
};

const createPlaceholderImages = async (items) => {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const imageMap = {};
  for (const item of items) {
    const filename = `${item.slug}.svg`;
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, svgPlaceholder(item.label, 'Available to borrow free', item.bg));
    }
    imageMap[item.slug] = `/uploads/${filename}`;
  }
  return imageMap;
};

const seed = async () => {
  await connectDB();
  console.log('Seeding BorrowBox demo data...\n');

  const reset = process.argv.includes('--reset');
  if (reset) {
    console.log('Resetting transactional data...');
    await Promise.all([
      BorrowRequest.deleteMany({}),
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
      Review.deleteMany({}),
      Report.deleteMany({}),
    ]);
    await Item.updateMany({}, { status: 'AVAILABLE', availability: true });
    await User.updateMany({}, { trustScore: 50, rating: 0, ratingCount: 0 });
    console.log('Transactional data cleared. Items reset to AVAILABLE.\n');
  }

  const demoUsers = [
    {
      email: 'lani@borrowbox.com',
      password: 'Lani@123',
      name: 'Lani',
      department: 'Computer Science Engineering',
      year: 3,
      role: 'student',
    },
    {
      email: 'arun@borrowbox.com',
      password: 'Arun@123',
      name: 'Arun Kumar',
      department: 'Computer Science Engineering',
      year: 3,
      role: 'student',
    },
  ];

  const createdUsers = {};
  for (const data of demoUsers) {
    const existing = await User.findOne({ email: data.email });
    if (existing) {
      console.log(`User already exists: ${data.email}`);
      createdUsers[data.email] = existing;
      continue;
    }
    const user = await User.create(data);
    console.log(`Created user: ${data.name} <${data.email}>`);
    createdUsers[data.email] = user;
  }

  const admin = await User.findOne({ email: 'admin@borrowbox.com' });
  if (!admin) {
    const created = await User.create({
      name: 'Admin',
      email: 'admin@borrowbox.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Operations',
    });
    console.log(`Created admin: ${created.email}`);
  } else {
    console.log('Admin already exists.');
  }

  const arun = createdUsers['arun@borrowbox.com'];

  const slugItem = (label, bg) => ({
    slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
    bg,
  });

  const placeholderSpecs = [
    slugItem('Scientific Calculator', '#4F46E5'),
    slugItem('Laptop Charger', '#0EA5E9'),
    slugItem('Engineering Drawing Kit', '#10B981'),
    slugItem('Umbrella', '#F59E0B'),
    slugItem('Power Bank', '#8B5CF6'),
    slugItem('Headphones', '#EC4899'),
    slugItem('Geometry Box', '#14B8A6'),
    slugItem('Water Bottle', '#6366F1'),
  ];

  const seedItems = [
    {
      name: 'Scientific Calculator',
      category: 'Academic',
      condition: 'Excellent',
      location: 'Main Block',
      description:
        'Casio scientific calculator with 240+ functions, perfect for engineering mathematics, calculus and physics problem sets. Battery included and fully functional. Handle with care.',
      slug: 'scientific-calculator',
    },
    {
      name: 'Laptop Charger',
      category: 'Electronics',
      condition: 'Good',
      location: 'Library',
      description:
        '65W laptop charger with USB-C output. Works with most modern laptops. Great for staying in the library all day. Slight wear on the cord but functions perfectly.',
      slug: 'laptop-charger',
    },
    {
      name: 'Engineering Drawing Kit',
      category: 'Academic',
      condition: 'Excellent',
      location: 'Engineering Block',
      description:
        'Complete engineering drawing kit with compass, divider, set squares, protractor, eraser and pencil. Ideal for first-year drafting labs and coursework.',
      slug: 'engineering-drawing-kit',
    },
    {
      name: 'Umbrella',
      category: 'Daily Use',
      condition: 'Good',
      location: 'Main Block',
      description:
        'Compact black umbrella that easily fits in a backpack. Perfect for sudden monsoon showers while walking between blocks on campus.',
      slug: 'umbrella',
    },
    {
      name: 'Power Bank',
      category: 'Electronics',
      condition: 'Good',
      location: 'Canteen',
      description:
        '10,000 mAh fast-charge power bank with dual output ports and a Type-C input. Charge your phone twice. Great for long lab days and study sessions.',
      slug: 'power-bank',
    },
  ];

  const imageMap = await createPlaceholderImages(placeholderSpecs);

  let created = 0;
  for (const data of seedItems) {
    const existing = await Item.findOne({ ownerId: arun._id, name: data.name });
    if (existing) {
      console.log(`Item already exists: "${data.name}"`);
      continue;
    }
    await Item.create({
      ownerId: arun._id,
      name: data.name,
      description: data.description,
      category: data.category,
      condition: data.condition,
      location: data.location,
      images: [imageMap[data.slug]],
      availability: true,
      status: 'AVAILABLE',
    });
    created += 1;
    console.log(`Created item: "${data.name}" (${data.category})`);
  }

  console.log(`\nSeed complete. Created ${created} new item(s).`);
  console.log('\nDemo credentials:');
  console.log('  Lani    -> lani@borrowbox.com / Lani@123');
  console.log('  Arun    -> arun@borrowbox.com / Arun@123');
  console.log('  Admin   -> admin@borrowbox.com / Admin@123');
  console.log('Passwords are stored hashed with bcrypt.');

  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});