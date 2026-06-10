import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const images = await prisma.productImage.findMany();
  console.log(`Found ${images.length} image records in database.`);
  
  let count = 0;
  for (const img of images) {
    if (img.url.startsWith('http://localhost:5000')) {
      const newUrl = img.url.replace('http://localhost:5000', 'https://balochi-bazar-backend.vercel.app');
      await prisma.productImage.update({
        where: { id: img.id },
        data: { url: newUrl },
      });
      console.log(`Updated: ${img.url} -> ${newUrl}`);
      count++;
    }
  }
  console.log(`Successfully updated ${count} image URLs to point to production backend.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
