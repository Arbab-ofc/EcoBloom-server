import mongoose from "mongoose";
import dotenv from "dotenv";
import { Plant } from "../models/Plant.js";
import { Category } from "../models/Category.js";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

const plants = [ {"name":"Money Plant","price":99,"categories":["Indoor","Air Purifying","Home Decor"],"image":"https://www.urvann.com/images/products/money-plant.webp"}, {"name":"Areca Palm","price":249,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/areca-palm.webp"}, {"name":"Bougainvillea","price":199,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/bougainvillea.webp"}, {"name":"Snake Plant","price":149,"categories":["Indoor","Succulent","Air Purifying"],"image":"https://www.urvann.com/images/products/snake-plant.webp"}, {"name":"Peace Lily","price":129,"categories":["Indoor","Flowering","Air Purifying"],"image":"https://www.urvann.com/images/products/peace-lily.webp"}, {"name":"Spider Plant","price":79,"categories":["Indoor","Air Purifying","Home Decor"],"image":"https://www.urvann.com/images/products/spider-plant.webp"}, {"name":"Aloe Vera","price":69,"categories":["Succulent","Air Purifying","Medicinal"],"image":"https://www.urvann.com/images/products/aloe-vera.webp"}, {"name":"ZZ Plant","price":179,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/zz-plant.webp"}, {"name":"Lucky Bamboo","price":99,"categories":["Indoor","Home Decor"],"image":"https://www.urvann.com/images/products/lucky-bamboo.webp"}, {"name":"Jade Plant","price":89,"categories":["Succulent","Indoor","Home Decor"],"image":"https://www.urvann.com/images/products/jade-plant.webp"}, {"name":"Rose","price":119,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/rose.webp"}, {"name":"Tulsi","price":49,"categories":["Outdoor","Medicinal"],"image":"https://www.urvann.com/images/products/tulsi.webp"}, {"name":"English Ivy","price":89,"categories":["Indoor","Outdoor","Air Purifying"],"image":"https://www.urvann.com/images/products/english-ivy.webp"}, {"name":"Fiddle Leaf Fig","price":299,"categories":["Indoor","Home Decor"],"image":"https://www.urvann.com/images/products/fiddle-leaf-fig.webp"}, {"name":"Bougainvillea Pink","price":219,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/bougainvillea-pink.webp"}, {"name":"Boston Fern","price":99,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/boston-fern.webp"}, {"name":"Rubber Plant","price":159,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/rubber-plant.webp"}, {"name":"Tecoma","price":109,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/tecoma.webp"}, {"name":"Mogra","price":69,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/mogra.webp"}, {"name":"Croton","price":99,"categories":["Indoor","Home Decor"],"image":"https://www.urvann.com/images/products/croton.webp"}, {"name":"Dieffenbachia","price":119,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/dieffenbachia.webp"}, {"name":"Philodendron","price":149,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/philodendron.webp"}, {"name":"Pothos","price":79,"categories":["Indoor","Air Purifying","Home Decor"],"image":"https://www.urvann.com/images/products/pothos.webp"}, {"name":"Dracaena","price":129,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/dracaena.webp"}, {"name":"Cactus","price":59,"categories":["Succulent","Outdoor"],"image":"https://www.urvann.com/images/products/cactus.webp"}, {"name":"Bamboo Palm","price":189,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/bamboo-palm.webp"}, {"name":"Gerbera Daisy","price":89,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/gerbera-daisy.webp"}, {"name":"Aglaonema","price":129,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/aglaonema.webp"}, {"name":"Schefflera","price":109,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/schefflera.webp"}, {"name":"Marigold","price":39,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/marigold.webp"}, {"name":"Petunia","price":69,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/petunia.webp"}, {"name":"Coleus","price":79,"categories":["Outdoor","Shade"],"image":"https://www.urvann.com/images/products/coleus.webp"}, {"name":"Succulent Mix","price":199,"categories":["Succulent","Indoor"],"image":"https://www.urvann.com/images/products/succulent-mix.webp"}, {"name":"Hibiscus","price":129,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/hibiscus.webp"}, {"name":"Kalanchoe","price":99,"categories":["Succulent","Indoor"],"image":"https://www.urvann.com/images/products/kalanchoe.webp"}, {"name":"Syngonium","price":89,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/syngonium.webp"}, {"name":"Palm Bonsai","price":299,"categories":["Indoor","Decor"],"image":"https://www.urvann.com/images/products/palm-bonsai.webp"}, {"name":"Chrysanthemum","price":79,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/chrysanthemum.webp"}, {"name":"Calathea","price":149,"categories":["Indoor","Decor"],"image":"https://www.urvann.com/images/products/calathea.webp"}, {"name":"Lily","price":99,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/lily.webp"}, {"name":"Datura","price":59,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/datura.webp"}, {"name":"Ixora","price":89,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/ixora.webp"}, {"name":"Sedum","price":69,"categories":["Succulent","Outdoor"],"image":"https://www.urvann.com/images/products/sedum.webp"}, {"name":"Palm Chamaedorea","price":159,"categories":["Indoor","Air Purifying"],"image":"https://www.urvann.com/images/products/palm-chamaedorea.webp"}, {"name":"Rajnigandha","price":79,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/rajnigandha.webp"}, {"name":"Mint","price":49,"categories":["Outdoor","Edible"],"image":"https://www.urvann.com/images/products/mint.webp"}, {"name":"Euphorbia","price":59,"categories":["Succulent","Outdoor"],"image":"https://www.urvann.com/images/products/euphorbia.webp"}, {"name":"Portulaca","price":39,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/portulaca.webp"}, {"name":"Tulip","price":129,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/tulip.webp"}, {"name":"Jasmine","price":69,"categories":["Outdoor","Flowering"],"image":"https://www.urvann.com/images/products/jasmine.webp"} ];

async function seedPlants() {
  try {
    await mongoose.connect(uri, { dbName: "ecobloom" });

    const allCategories = await Category.find().lean();

    const mappedPlants = plants.map(p => {
      
      const matchedIds = allCategories
        .filter(cat => cat.keywords.some(k => p.categories.includes(k)))
        .map(cat => cat._id);

      return {
        name: p.name,
        price: p.price,
        categories: matchedIds,
        image: p.image,
        available: true
      };
    });

    await Plant.deleteMany();         
    await Plant.insertMany(mappedPlants);

    console.log("🌱 Plants seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding plants:", err);
    process.exit(1);
  }
}

seedPlants();
