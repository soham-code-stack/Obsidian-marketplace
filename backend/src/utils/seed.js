/**
 * Seed script — populates the database with demo sellers, shops, buyers,
 * and products so the marketplace has something to browse/search/purchase
 * immediately, without manually registering accounts and adding listings.
 *
 * Usage:
 *   npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { initMeilisearch } = require('../config/meilisearch');
const { indexProduct, removeProductFromIndex } = require('../services/searchSync');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

const DEMO_SELLERS = [
  {
    name: 'Marcus Chen',
    email: 'marcus@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Northline Audio & Tech',
      slug: 'northline-audio',
      description: 'Precision audio engineering, audiophile electronics, and high-fidelity hardware.',
    },
    products: [
      {
        name: 'Sonic Obsidian Pro ANC Headphones',
        description: 'Flagship audiophile wireless headphones engineered with 40mm beryllium drivers, zero-gravity titanium frame, and hybrid active noise cancellation.',
        price: 2499900,
        compareAtPrice: 2999900,
        category: 'Electronics',
        tags: ['audio', 'headphones', 'wireless', 'anc', 'obsidian', 'electronics', 'premium'],
        images: [
          '/images/Sonic Obsidian Pro ANC Headphones_1.png',
          '/images/Sonic Obsidian Pro ANC Headphones_2.png',
        ],
        stock: 15,
        featured: true,
      },
      {
        name: 'Walnut Wireless Over-Ear Headphones',
        description: 'Over-ear wireless headphones with handcrafted real walnut veneer earcups, aptX HD codec support, and 30-hour battery life.',
        price: 299900,
        compareAtPrice: 399900,
        category: 'Electronics',
        tags: ['audio', 'headphones', 'wireless', 'music', 'electronics'],
        images: [
          '/images/wallnut wireless overear headphone_1.png',
          '/images/wallnut wireless overear headphone_2.png',
        ],
        stock: 12,
        featured: true,
      },
      {
        name: 'Electric Milk Frother & Steamer',
        description: 'Automatic high-speed electric milk frother with stainless steel whisk for barista-quality hot and cold microfoam in seconds.',
        price: 79900,
        compareAtPrice: 119900,
        category: 'Electronics',
        tags: ['frother', 'electric', 'milk', 'kitchen', 'appliances', 'electronics', 'coffee'],
        images: [
          '/images/Electric Milk Frother & Steamer_1.png',
          '/images/Electric Milk Frother & Steamer_2.png',
        ],
        stock: 25,
      },
      {
        name: 'Portable Bluetooth Turntable',
        description: 'Compact belt-drive vinyl record turntable with built-in Bluetooth transmitter, dynamic stereo speakers, and USB digitizer.',
        price: 499900,
        compareAtPrice: 599900,
        category: 'Electronics',
        tags: ['audio', 'vinyl', 'turntable', 'music', 'electronics'],
        images: [
          '/images/portable bluetooth turntable 1.png',
          '/images/portable bluetooth turntable 2.png',
        ],
        stock: 8,
      },
      {
        name: 'Analog Desktop Headphone Amplifier',
        description: 'Class-A discrete desktop headphone amplifier with ultra-low distortion and warm vacuum-inspired sound signature.',
        price: 249900,
        category: 'Electronics',
        tags: ['audio', 'amplifier', 'headphones', 'electronics'],
        images: [
          '/images/analog desktop headphone amplifier 1.png',
          '/images/analog desktop headphone amplifier 2.png',
        ],
        stock: 14,
      },
      {
        name: 'Minimalist Wooden Desk LED Smart Lamp',
        description: 'Touch-dimmable LED desk lamp with solid natural beechwood base, eye-care ambient light, and integrated wireless fast charging.',
        price: 159900,
        category: 'Electronics',
        tags: ['lamp', 'lighting', 'desk', 'wireless-charger', 'electronics', 'smart-home'],
        images: [
          '/images/desk led smart lamp 1.png',
          '/images/desk led smart lamp 2.png',
        ],
        stock: 18,
      },
    ],
  },
  {
    name: 'Elena Ruiz',
    email: 'elena@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Terra & Clay Ceramics',
      slug: 'terra-and-clay-ceramics',
      description: 'Handmade stoneware pottery, thrown and glazed in small batches.',
    },
    products: [
      {
        name: 'Speckled Stoneware Ceramic Mug',
        description: 'A hand-thrown 12oz stoneware mug with a matte speckled volcanic glaze. Microwave and dishwasher safe.',
        price: 49900,
        category: 'Home & Living',
        tags: ['ceramics', 'handmade', 'mug', 'pottery', 'kitchen'],
        images: [
          '/images/speckled stoneware ceramic mug 1.png',
          '/images/speckled stoneware ceramic mug 2.png',
        ],
        stock: 25,
      },
      {
        name: 'Wide Rim Ceramic Bowl Set (2pc)',
        description: 'Two nesting artisanal stoneware bowls in a warm oatmeal glaze, perfect for salads, pasta, or soups.',
        price: 79900,
        category: 'Home & Living',
        tags: ['ceramics', 'handmade', 'bowl', 'pottery', 'dining'],
        images: [
          '/images/ceramic bowl set 1.png',
          '/images/ceramic bowl set 2.png',
        ],
        stock: 15,
      },
      {
        name: 'Minimalist Bud Vase',
        description: 'A slender single-stem ceramic vase with a satin finish, ideal for showcasing dried botanicals or fresh blooms.',
        price: 59900,
        category: 'Home & Living',
        tags: ['ceramics', 'handmade', 'vase', 'pottery', 'decor'],
        images: [
          '/images/bud vase 1.png',
          '/images/bud vase 2.png',
        ],
        stock: 10,
      },
    ],
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Urban Loom Studio',
      slug: 'urban-loom',
      description: 'Modern artisanal home decor, handcrafted furnishings, and cozy everyday essentials.',
    },
    products: [
      {
        name: 'Handwoven Cotton Cushion Cover',
        description: 'A soft handwoven textured cotton cushion cover designed for modern living rooms and cozy corners.',
        price: 49900,
        category: 'Home & Living',
        tags: ['home', 'decor', 'cushion', 'cotton', 'living-room'],
        images: [
          '/images/cushion cover 1.png',
          '/images/cushion cover 2.png',
        ],
        stock: 25,
      },
      {
        name: 'Woven Natural Storage Basket',
        description: 'A durable handcrafted woven basket for organizing throws, magazines, or everyday essentials.',
        price: 119900,
        category: 'Home & Living',
        tags: ['home', 'storage', 'basket', 'organization'],
        images: [
          '/images/storage basket 1.png',
          '/images/storage basket 2.png',
        ],
        stock: 12,
      },
      {
        name: 'Handcrafted Round Wall Mirror',
        description: 'A minimal round wall mirror with an organic solid frame that adds light and depth to entryways.',
        price: 189900,
        category: 'Home & Living',
        tags: ['mirror', 'wall-decor', 'home', 'handcrafted'],
        images: [
          '/images/round wall mirror 1.png',
          '/images/round wall mirror 2.png',
        ],
        stock: 7,
      },
      {
        name: 'Soft Woven Cotton Throw Blanket',
        description: 'A breathable pure cotton jacquard throw blanket perfect for couches, bed styling, and chilly evenings.',
        price: 99900,
        category: 'Home & Living',
        tags: ['blanket', 'cotton', 'home', 'living-room'],
        images: [
          '/images/throw blanket 1.png',
          '/images/throw blanket 2.png',
        ],
        stock: 20,
      },
    ],
  },
  {
    name: 'Priya Nair',
    email: 'priya@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Fernwood Botanicals',
      slug: 'fernwood-botanicals',
      description: 'Lush indoor houseplants, terrarium kits, and botanical accessories delivered fresh.',
    },
    products: [
      {
        name: 'Golden Pothos Trailing Vine (6" Pot)',
        description: 'A hardy, low-maintenance air-purifying trailing houseplant that flourishes in ambient room light.',
        price: 39900,
        category: 'Plants & Botanicals',
        tags: ['plants', 'pothos', 'indoor', 'botanical', 'decor'],
        images: [
          '/images/golden pothos trailing vine 1.png',
          '/images/golden pothos trailing vine 2.png',
        ],
        stock: 30,
      },
      {
        name: 'Closed Self-Sustaining Terrarium Kit',
        description: 'A complete DIY kit featuring handblown glass vessel, live mosses, fittonia plants, and layered drainage substrates.',
        price: 89900,
        category: 'Plants & Botanicals',
        tags: ['plants', 'terrarium', 'kit', 'decor', 'diy'],
        images: [
          '/images/terrarium kit 1.png',
          '/images/terrarium kit 2.png',
        ],
        stock: 18,
      },
      {
        name: 'Fiddle Leaf Fig Tree (10" Pot)',
        description: 'A statement architectural floor plant with broad sculpted violin-shaped foliage for bright spaces.',
        price: 129900,
        category: 'Plants & Botanicals',
        tags: ['plants', 'fiddle-leaf-fig', 'indoor', 'floor-plant'],
        images: [
          '/images/fiddle leaf fig tree 1.png',
          '/images/fiddle leaf fig tree 2.png',
        ],
        stock: 12,
      },
    ],
  },
  {
    name: 'Rohan Kapoor',
    email: 'rohan@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Trailbound Outdoors',
      slug: 'trailbound-outdoors',
      description: 'Rugged outdoor gear, expedition packs, and weatherproof adventure essentials.',
    },
    products: [
      {
        name: 'Insulated Stainless Steel Bottle (750ml)',
        description: 'Vacuum insulated double-wall stainless steel bottle that keeps liquids cold for 24h or steaming hot for 12h.',
        price: 69900,
        category: 'Outdoors & Travel',
        tags: ['bottle', 'outdoor', 'travel', 'camping', 'gear'],
        images: [
          '/images/bottle 1.png',
          '/images/bottle 2.png',
        ],
        stock: 35,
      },
      {
        name: 'Compact LED Camping Lantern',
        description: 'Ultra-bright 500-lumen rechargeable lantern with warm ambient dimming mode and powerbank charging output.',
        price: 89900,
        category: 'Outdoors & Travel',
        tags: ['camping', 'lantern', 'outdoor', 'travel', 'lighting'],
        images: [
          '/images/lantern 1.png',
          '/images/lantern 2.png',
        ],
        stock: 22,
      },
      {
        name: 'Waterproof Hiking Backpack (35L)',
        description: 'Ergonomic 35-liter weatherproof backpack with ripstop nylon shell, hydration sleeve, and padded lumbar support.',
        price: 189900,
        category: 'Outdoors & Travel',
        tags: ['backpack', 'hiking', 'travel', 'waterproof', 'bags'],
        images: [
          '/images/hiking backpack 1.png',
          '/images/hiking backpack 2.png',
        ],
        stock: 14,
      },
      {
        name: 'Portable Folding Camping Chair',
        description: 'Aircraft-grade aluminum frame foldable chair that weighs under 2 lbs and supports up to 300 lbs.',
        price: 149900,
        category: 'Outdoors & Travel',
        tags: ['camping', 'chair', 'outdoor', 'portable'],
        images: [
          '/images/camping chair 1.png',
          '/images/camping chair 2.png',
        ],
        stock: 11,
      },
      {
        name: 'Travel Organizer Pouch Set (3pc)',
        description: 'Set of 3 compression travel cubes with moisture-resistant lining for chargers, cords, and garments.',
        price: 79900,
        category: 'Outdoors & Travel',
        tags: ['travel', 'organizer', 'pouch', 'accessories'],
        images: [
          '/images/travel pouch 1.png',
          '/images/travel pouch 2.png',
        ],
        stock: 28,
      },
      {
        name: 'Lightweight Waterproof Picnic Mat',
        description: 'Packable outdoor ground mat with waterproof backing for picnics, beaches, and campsite lounging.',
        price: 109900,
        category: 'Outdoors & Travel',
        tags: ['picnic', 'mat', 'camping', 'outdoor'],
        images: [
          '/images/picnic mat 1.png',
          '/images/picnic mat 2.png',
        ],
        stock: 18,
      },
    ],
  },
  {
    name: 'Ananya Sharma',
    email: 'ananya@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Luna & Thread',
      slug: 'luna-and-thread',
      description: 'Understated everyday apparel, premium woven knitwear, and timeless lifestyle accessories.',
    },
    products: [
      {
        name: 'Relaxed Fit Cotton Linen Shirt',
        description: 'A breathable relaxed-drape shirt crafted from premium organic cotton-linen blend for effortless styling.',
        price: 99900,
        category: 'Apparel & Fashion',
        tags: ['clothing', 'shirt', 'cotton', 'casual', 'fashion'],
        images: [
          '/images/linen shirt 1.png',
          '/images/linen shirt 2.png',
        ],
        stock: 24,
      },
      {
        name: 'Ribbed Knit Oversized Cardigan',
        description: 'A chunky ribbed knit cardigan made with cloud-soft yarn, featuring dropped shoulders and horn buttons.',
        price: 149900,
        category: 'Apparel & Fashion',
        tags: ['clothing', 'cardigan', 'knit', 'fashion', 'outerwear'],
        images: [
          '/images/cardigan 1.png',
          '/images/cardigan 2.png',
        ],
        stock: 15,
      },
      {
        name: 'Heavy Canvas Everyday Tote Bag',
        description: 'Heavyweight 16oz organic canvas tote bag with reinforced dual straps and an interior zip compartment.',
        price: 69900,
        category: 'Apparel & Fashion',
        tags: ['bag', 'tote', 'canvas', 'everyday', 'accessories'],
        images: [
          '/images/handbag 1.png',
          '/images/handbag 2.png',
        ],
        stock: 30,
      },
      {
        name: 'Classic Bifold Leather Wallet',
        description: 'Hand-stitched full-grain leather wallet with 6 card slots, dual cash sleeve, and RFID protection.',
        price: 129900,
        category: 'Apparel & Fashion',
        tags: ['wallet', 'leather', 'accessories', 'fashion'],
        images: [
          '/images/wallet 1.png',
          '/images/wallet 2.png',
        ],
        stock: 19,
      },
      {
        name: 'Minimal Gold-Plated Hoop Earrings',
        description: 'Hypoallergenic 18k gold-plated huggie hoop earrings with a sleek mirror-polished finish.',
        price: 59900,
        category: 'Apparel & Fashion',
        tags: ['jewelry', 'earrings', 'hoops', 'accessories'],
        images: [
          '/images/gold earring 1.png',
          '/images/gold earring 2.png',
        ],
        stock: 40,
      },
      {
        name: 'Soft Cashmere Blend Everyday Scarf',
        description: 'A feather-light cashmere blend scarf providing gentle warmth with subtle fringed hemlines.',
        price: 79900,
        category: 'Apparel & Fashion',
        tags: ['scarf', 'fashion', 'accessories', 'casual'],
        images: [
          '/images/scarf 1.png',
          '/images/scarf 2.png',
        ],
        stock: 21,
      },
    ],
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@demo-shop.test',
    password: 'password123',
    role: 'seller',
    shop: {
      name: 'Brew & Bean Co.',
      slug: 'brew-and-bean-co',
      description: 'Specialty coffee gear, manual brew bar equipment, and artisanal roasted accessories.',
    },
    products: [
      {
        name: 'Artisanal Ceramic Coffee Mug',
        description: 'Ergonomic heavy-ceramic coffee mug with heat-retentive clay body and comfortable thumb rest.',
        price: 44900,
        category: 'Coffee & Brewing',
        tags: ['coffee', 'mug', 'ceramic', 'kitchen'],
        images: [
          '/images/artisanal mug 1.png',
          '/images/artisanal mug 2.png',
        ],
        stock: 45,
      },
      {
        name: 'Borosilicate Glass French Press Maker',
        description: 'Heat-resistant borosilicate glass French press with double-mesh stainless steel plunger for rich coffee oil extraction.',
        price: 99900,
        category: 'Coffee & Brewing',
        tags: ['coffee', 'french-press', 'brewing', 'kitchen'],
        images: [
          '/images/french press maker 1.png',
          '/images/french press maker 2.png',
        ],
        stock: 18,
      },
      {
        name: 'Precision Manual Burr Coffee Grinder',
        description: 'CNC stainless steel conical burr grinder with dual-bearing stabilization and stepped click grind adjustment.',
        price: 159900,
        category: 'Coffee & Brewing',
        tags: ['coffee', 'grinder', 'brewing', 'beans'],
        images: [
          '/images/coffee grinder 1.png',
          '/images/coffee grinder 2.png',
        ],
        stock: 13,
      },
      {
        name: 'Handcrafted Pour-Over Dripper & Carafe Set',
        description: 'V60 geometric glass dripper with solid acacia collar and matching 600ml glass server.',
        price: 129900,
        category: 'Coffee & Brewing',
        tags: ['coffee', 'pour-over', 'brewing', 'kitchen'],
        images: [
          '/images/dripper nd carafe set 1.png',
          '/images/dripper nd carafe set 2.png',
        ],
        stock: 16,
      },
      {
        name: 'Airtight UV-Shield Coffee Bean Canister',
        description: 'Stainless steel canister with one-way CO2 degassing valve and date-tracking wheel to lock in coffee freshness.',
        price: 69900,
        category: 'Coffee & Brewing',
        tags: ['coffee', 'storage', 'canister', 'beans'],
        images: [
          '/images/coffee bean cannister 1.png',
          '/images/coffee bean cannister 2.png',
        ],
        stock: 23,
      },
    ],
  },
];

const DEMO_BUYER = {
  name: 'Demo Buyer',
  email: 'buyer@demo-shop.test',
  password: 'password123',
  role: 'buyer',
};

const demoEmails = DEMO_SELLERS.map((s) => s.email).concat(DEMO_BUYER.email);

const run = async () => {
  await connectDB();
  await initMeilisearch();

  console.log('[Seed] Clearing previous demo data (matched by email/slug)...');
  const shopSlugs = DEMO_SELLERS.map((s) => s.shop.slug);
  const existingDemoShops = await Shop.find({ slug: { $in: shopSlugs } });
  const existingShopIds = existingDemoShops.map((s) => s._id);

  const staleProducts = await Product.find({ shop: { $in: existingShopIds } });
  for (const stale of staleProducts) {
    await removeProductFromIndex(stale._id);
  }

  await Product.deleteMany({ shop: { $in: existingShopIds } });
  await Shop.deleteMany({ slug: { $in: shopSlugs } });
  await User.deleteMany({ email: { $in: demoEmails } });

  console.log('[Seed] Creating demo buyer...');
  await User.create(DEMO_BUYER);

  for (const sellerData of DEMO_SELLERS) {
    console.log(`[Seed] Creating seller "${sellerData.name}"...`);
    const user = await User.create({
      name: sellerData.name,
      email: sellerData.email,
      password: sellerData.password,
      role: 'seller',
    });

    const shop = await Shop.create({
      owner: user._id,
      name: sellerData.shop.name,
      slug: sellerData.shop.slug,
      description: sellerData.shop.description,
    });

    user.shop = shop._id;
    await user.save();

    for (const productData of sellerData.products) {
      const product = await Product.create({ ...productData, shop: shop._id });
      await indexProduct(product, shop);
      console.log(`  [Seed] Added product "${product.name}" (${product.category})`);
    }
  }

  console.log('\n[Seed] Done! Demo accounts (all use password: password123):');
  console.log('  Buyer:  buyer@demo-shop.test');
  DEMO_SELLERS.forEach((s) => console.log(`  Seller: ${s.email}  (shop: ${s.shop.name})`));

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
