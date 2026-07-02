import { prisma } from '@/lib/prisma';
import LandingPageWrapper from '@/components/LandingPageWrapper';

export const dynamic = 'force-dynamic'; // Make it dynamic to reflect CMS updates instantly

export default async function Home() {
  // Fetch services and convert Decimal price to number for serialization
  const rawServices = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });

  const services = rawServices.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: Number(service.price),
    durationMin: service.durationMin,
  }));

  // Fetch Tenant config (assuming single-tenant for now)
  const tenant = await prisma.tenant.findFirst();
  const themeConfig = (tenant?.themeConfig as Record<string, any>) || {};

  const siteConfig = {
    heroName: themeConfig.heroName || 'ALEMÃO 777',
    instagram: themeConfig.instagram || 'https://www.instagram.com/barbeariadoalemao777/',
    whatsapp: themeConfig.whatsapp || '+5513974249209',
    address: themeConfig.address || 'Rua Espanha, 360 - Jardim Casqueiro - Cubatão / SP',
    galleryUrls: themeConfig.galleryUrls || ['/haircut-fade.png', '/haircut-beard.png', '/haircut-classic.png'],
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <LandingPageWrapper services={services} siteConfig={siteConfig} />
    </main>
  );
}
