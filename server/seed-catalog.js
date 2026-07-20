import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Item from './src/models/Item.js';

dotenv.config();

const STORES = [
  {
    email: 'store@test.com',
    password: '123456',
    fullName: 'Test Store',
    companyName: 'Test Atelier',
    philosophy: 'Contemporary furniture with warm materials and calm silhouettes.',
  },
  {
    email: 'curator@lumina.com',
    password: '123456',
    fullName: 'Elena Marchetti',
    companyName: 'Lumina Atelier',
    philosophy: 'Sculptural seating and statement lighting for refined interiors.',
  },
  {
    email: 'nordica@lumina.com',
    password: '123456',
    fullName: 'Jonas Lind',
    companyName: 'Nordica Home',
    philosophy: 'Nordic minimalism with oak, linen, and muted stone palettes.',
  },
  {
    email: 'maison@lumina.com',
    password: '123456',
    fullName: 'Camille Duval',
    companyName: 'Maison Form',
    philosophy: 'Parisian modern tables, case goods, and bedroom collections.',
  },
];

const buildDescription = (text, category, material, dimensions) =>
  `${text}\n\n---\nCategory: ${category}\nMaterial: ${material}\nDimensions: ${dimensions} cm\nAvailability: In Stock`;

// Demo catalog prices in USD (~$120–$950)
const AFFORDABLE_PRICES = [
  129.99, 159.5, 189.0, 219.75, 249.99, 289.5, 329.0, 369.99,
  419.25, 459.0, 499.99, 549.5, 599.0, 649.99, 749.5, 849.99, 949.0,
];

const applyAffordablePrices = (catalog) => {
  catalog.forEach((item, index) => {
    item.price = AFFORDABLE_PRICES[index % AFFORDABLE_PRICES.length];
  });
};

const CATALOG = [
  // Test Atelier
  {
    storeEmail: 'store@test.com',
    name: 'Ether Arc Lounge Chair',
    category: 'Seating',
    price: 28900000,
    quantity: 14,
    material: 'Walnut frame, ivory boucle',
    dimensions: '82w x 78h x 85d',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.8,
    numReviews: 32,
    blurb: 'A sculptural lounge chair with a floating seat and soft architectural curve.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Orbital Sphere Lamp',
    category: 'Lighting',
    price: 8900000,
    quantity: 26,
    material: 'Brushed brass, opal glass',
    dimensions: '35w x 48h x 35d',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.6,
    numReviews: 19,
    blurb: 'A glowing orb lamp that anchors side tables and reading corners.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Monolith Travertine Table',
    category: 'Tables',
    price: 76000000,
    quantity: 6,
    material: 'Honed travertine',
    dimensions: '220w x 75h x 100d',
    image: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.9,
    numReviews: 11,
    blurb: 'A monolithic dining table with natural stone movement and weight.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Stratus Modular Sofa',
    category: 'Living Room',
    price: 112000000,
    quantity: 4,
    material: 'Pebble grey boucle, ash base',
    dimensions: '320w x 72h x 110d',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.7,
    numReviews: 24,
    blurb: 'Low-profile modular seating designed for open-plan living rooms.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Velvet Dining Chair',
    category: 'Seating',
    price: 12500000,
    quantity: 22,
    material: 'Deep olive velvet, black steel',
    dimensions: '52w x 86h x 58d',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.4,
    numReviews: 15,
    blurb: 'Upholstered dining chair with a refined seam and slim profile.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Brass Arc Floor Lamp',
    category: 'Lighting',
    price: 15400000,
    quantity: 11,
    material: 'Antique brass, linen shade',
    dimensions: '45w x 168h x 45d',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.5,
    numReviews: 17,
    blurb: 'An arc floor lamp with a soft directional glow for lounge zones.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Marble Side Table',
    category: 'Tables',
    price: 9800000,
    quantity: 18,
    material: 'Carrara marble, matte steel',
    dimensions: '45w x 52h x 45d',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.3,
    numReviews: 9,
    blurb: 'Compact side table with a cool stone top and quiet presence.',
  },
  {
    storeEmail: 'store@test.com',
    name: 'Oblique Lounge Chair',
    category: 'Living Room',
    price: 32100000,
    quantity: 9,
    material: 'Smoked oak, sand linen',
    dimensions: '78w x 82h x 80d',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.6,
    numReviews: 13,
    blurb: 'Angled lounge chair with a deep seat for slow evenings.',
  },

  // Lumina Atelier
  {
    storeEmail: 'curator@lumina.com',
    name: 'Aurelia Cloud Sofa',
    category: 'Living Room',
    price: 98500000,
    quantity: 5,
    material: 'Cloud white linen blend',
    dimensions: '280w x 68h x 105d',
    image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.8,
    numReviews: 21,
    blurb: 'Deep-seat sofa with feather-soft cushions and a gallery-like silhouette.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Halo Pendant Light',
    category: 'Lighting',
    price: 11200000,
    quantity: 16,
    material: 'Matte black, frosted acrylic',
    dimensions: '60w x 12h x 60d',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.7,
    numReviews: 14,
    blurb: 'Ring pendant that creates layered light over dining tables.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Atelier Writing Desk',
    category: 'Office',
    price: 42800000,
    quantity: 7,
    material: 'White oak, brushed nickel',
    dimensions: '160w x 76h x 70d',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.5,
    numReviews: 10,
    blurb: 'Minimal writing desk with cable routing and soft rounded corners.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Contour Bar Stool',
    category: 'Kitchen',
    price: 6900000,
    quantity: 28,
    material: 'Beech wood, matte black footrest',
    dimensions: '42w x 76h x 42d',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.4,
    numReviews: 18,
    blurb: 'Curved bar stool for kitchen islands and morning coffee rituals.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Gallery Console',
    category: 'Tables',
    price: 35600000,
    quantity: 8,
    material: 'Ebonized ash, bronze hardware',
    dimensions: '180w x 80h x 40d',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.6,
    numReviews: 8,
    blurb: 'Long console table for entryways, art, and curated objects.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Lumen Bed Frame',
    category: 'Bedroom',
    price: 54800000,
    quantity: 6,
    material: 'Upholstered headboard, oak rails',
    dimensions: '220w x 120h x 210d',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.7,
    numReviews: 12,
    blurb: 'Low platform bed with an upholstered headboard and calm proportions.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Studio Task Chair',
    category: 'Office',
    price: 18700000,
    quantity: 15,
    material: 'Mesh back, aluminum base',
    dimensions: '62w x 98h x 62d',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.3,
    numReviews: 26,
    blurb: 'Ergonomic task chair with a slim visual profile for home offices.',
  },
  {
    storeEmail: 'curator@lumina.com',
    name: 'Prism Coffee Table',
    category: 'Living Room',
    price: 21400000,
    quantity: 12,
    material: 'Smoked glass, black steel',
    dimensions: '110w x 38h x 60d',
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.5,
    numReviews: 16,
    blurb: 'Layered coffee table with geometric tiers and reflective surfaces.',
  },

  // Nordica Home
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Fjord Oak Dining Table',
    category: 'Kitchen',
    price: 67200000,
    quantity: 5,
    material: 'Solid white oak',
    dimensions: '200w x 76h x 95d',
    image: 'https://images.unsplash.com/photo-1615529328331-f8917597711f?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.8,
    numReviews: 9,
    blurb: 'Rounded-edge dining table with honest timber grain and soft corners.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Birch Platform Bed',
    category: 'Bedroom',
    price: 48900000,
    quantity: 7,
    material: 'Birch plywood, linen upholstery',
    dimensions: '210w x 95h x 205d',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.6,
    numReviews: 11,
    blurb: 'Platform bed with integrated night ledges and a calm Nordic palette.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Linen Armchair',
    category: 'Seating',
    price: 23800000,
    quantity: 13,
    material: 'Natural linen, oak legs',
    dimensions: '74w x 80h x 78d',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.4,
    numReviews: 14,
    blurb: 'Relaxed armchair with a breathable linen cover and soft seat.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Arctic Floor Lamp',
    category: 'Lighting',
    price: 9200000,
    quantity: 19,
    material: 'Powder-coated steel, linen shade',
    dimensions: '40w x 155h x 40d',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.5,
    numReviews: 7,
    blurb: 'Tall floor lamp with a diffused glow for reading nooks.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Bergen Bookshelf',
    category: 'Office',
    price: 27400000,
    quantity: 10,
    material: 'Oak veneer, steel frame',
    dimensions: '120w x 190h x 35d',
    image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.3,
    numReviews: 6,
    blurb: 'Open shelving unit for books, objects, and workspace storage.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Fjell Sideboard',
    category: 'Living Room',
    price: 51800000,
    quantity: 4,
    material: 'Oak, cane panel inserts',
    dimensions: '200w x 75h x 45d',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.7,
    numReviews: 8,
    blurb: 'Storage sideboard with cane fronts and a warm Scandinavian tone.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Nord Bench',
    category: 'Seating',
    price: 8400000,
    quantity: 20,
    material: 'Solid oak',
    dimensions: '120w x 45h x 35d',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.2,
    numReviews: 5,
    blurb: 'Simple oak bench for entryways, bedsides, and dining extras.',
  },
  {
    storeEmail: 'nordica@lumina.com',
    name: 'Stone Nightstand',
    category: 'Bedroom',
    price: 7600000,
    quantity: 17,
    material: 'Limestone top, oak base',
    dimensions: '50w x 52h x 42d',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.4,
    numReviews: 10,
    blurb: 'Compact nightstand pairing stone weight with timber warmth.',
  },

  // Maison Form
  {
    storeEmail: 'maison@lumina.com',
    name: 'Rue Marble Dining Set',
    category: 'Kitchen',
    price: 138000000,
    quantity: 3,
    material: 'Calacatta marble, brass legs',
    dimensions: '240w x 76h x 110d',
    image: 'https://images.unsplash.com/photo-1616137466211-f939a420be84?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.9,
    numReviews: 6,
    blurb: 'Statement dining table with veined marble and polished brass base.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Tuileries Velvet Sofa',
    category: 'Living Room',
    price: 124000000,
    quantity: 4,
    material: 'Champagne velvet, walnut base',
    dimensions: '260w x 74h x 98d',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.8,
    numReviews: 15,
    blurb: 'Parisian-inspired sofa with deep cushions and a refined low arm.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Atelier Vanity Desk',
    category: 'Bedroom',
    price: 31200000,
    quantity: 8,
    material: 'Pale ash, mirrored top',
    dimensions: '120w x 78h x 48d',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.5,
    numReviews: 9,
    blurb: 'Vanity desk with soft curves and a mirrored surface for dressing rooms.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Lumiere Table Lamp',
    category: 'Lighting',
    price: 6800000,
    quantity: 24,
    material: 'Alabaster base, linen shade',
    dimensions: '28w x 42h x 28d',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.6,
    numReviews: 22,
    blurb: 'Bedside lamp with an alabaster glow and tailored shade.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Champs Executive Chair',
    category: 'Office',
    price: 24600000,
    quantity: 11,
    material: 'Leather seat, chrome base',
    dimensions: '66w x 112h x 66d',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.4,
    numReviews: 13,
    blurb: 'Executive chair with tailored leather and a polished base.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Parc Nesting Tables',
    category: 'Tables',
    price: 15800000,
    quantity: 14,
    material: 'Walnut, smoked glass',
    dimensions: '55w x 50h x 55d',
    image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.3,
    numReviews: 7,
    blurb: 'Set of nesting tables for flexible styling in compact spaces.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Soleil Outdoor Chair',
    category: 'Seating',
    price: 11900000,
    quantity: 16,
    material: 'Teak, weatherproof weave',
    dimensions: '60w x 82h x 62d',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.5,
    numReviews: 11,
    blurb: 'Outdoor lounge chair with teak arms and a woven seat.',
  },
  {
    storeEmail: 'maison@lumina.com',
    name: 'Mirage Media Console',
    category: 'Living Room',
    price: 46700000,
    quantity: 6,
    material: 'Smoked oak, bronze mesh',
    dimensions: '220w x 55h x 45d',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80',
    averageRating: 4.6,
    numReviews: 8,
    blurb: 'Media console with vented doors and hidden cable management.',
  },
];

applyAffordablePrices(CATALOG);

const JUNK_NAMES = new Set(['e', 'test', 'test2', '4', 'rồng con']);

const ensureStores = async () => {
  const storeMap = new Map();

  for (const store of STORES) {
    const email = store.email.toLowerCase();
    let user = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(store.password, 10);

    if (!user) {
      user = await User.create({
        fullName: store.fullName,
        email,
        password: hashedPassword,
        isVerified: true,
        role: 'store',
        vendorStatus: 'approved',
        companyName: store.companyName,
        philosophy: store.philosophy,
      });
      console.log(`Created store: ${store.companyName}`);
    } else {
      user.password = hashedPassword;
      user.isVerified = true;
      user.role = 'store';
      user.vendorStatus = 'approved';
      user.companyName = store.companyName;
      user.philosophy = store.philosophy;
      await user.save();
      console.log(`Store ready: ${store.companyName}`);
    }

    storeMap.set(email, user._id);
  }

  return storeMap;
};

const cleanJunkItems = async () => {
  const junkItems = await Item.find({});
  let removed = 0;

  for (const item of junkItems) {
    const normalized = (item.name || '').trim().toLowerCase();
    if (JUNK_NAMES.has(normalized) || normalized.length <= 1) {
      await Item.deleteOne({ _id: item._id });
      removed += 1;
    }
  }

  if (removed > 0) {
    console.log(`Removed ${removed} placeholder items`);
  }
};

const seedCatalog = async (storeMap) => {
  let created = 0;
  let updated = 0;

  for (const product of CATALOG) {
    const ownerId = storeMap.get(product.storeEmail.toLowerCase());
    if (!ownerId) continue;

    const payload = {
      name: product.name,
      description: buildDescription(
        product.blurb,
        product.category,
        product.material,
        product.dimensions
      ),
      quantity: product.quantity,
      price: product.price,
      category: product.category,
      owner: ownerId,
      image: product.image,
      averageRating: product.averageRating,
      numReviews: product.numReviews,
    };

    const existing = await Item.findOne({ name: product.name, owner: ownerId });

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
    } else {
      await Item.create(payload);
      created += 1;
    }
  }

  console.log(`Catalog seeded: ${created} created, ${updated} updated (${CATALOG.length} total)`);
};

const VND_PER_USD = 25000;

const convertLegacyVndPrices = async () => {
  const legacyItems = await Item.find({ price: { $gte: 10000 } });
  let converted = 0;

  for (const item of legacyItems) {
    item.price = Math.round((item.price / VND_PER_USD) * 100) / 100;
    await item.save();
    converted += 1;
  }

  if (converted > 0) {
    console.log(`Converted ${converted} legacy VND prices to USD (rate: ${VND_PER_USD})`);
  }
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in server/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  await cleanJunkItems();
  const storeMap = await ensureStores();
  await seedCatalog(storeMap);
  await convertLegacyVndPrices();

  const total = await Item.countDocuments();
  const storeCount = storeMap.size;
  console.log('--------------------------------------------------');
  console.log(`Catalog live: ${total} products across ${storeCount} curators`);
  console.log('Store logins (password: 123456):');
  STORES.forEach((store) => console.log(`  - ${store.email} (${store.companyName})`));
  console.log('--------------------------------------------------');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
