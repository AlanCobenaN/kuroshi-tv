// ================================================================
// KUROSHI.TV — SEED DE BASE DE DATOS
// Datos iniciales requeridos para que el sitio funcione.
// Ejecutar con: npm run prisma:seed
// ================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Kuroshi.tv...\n');

  // ── 1. GÉNEROS ────────────────────────────────────────────────
  console.log('📂 Creando géneros...');

  const genres = [
    'Acción',
    'Aventura',
    'Comedia',
    'Drama',
    'Ecchi',
    'Fantasía',
    'Horror',
    'Isekai',
    'Magia',
    'Mecha',
    'Misterio',
    'Psicológico',
    'Romance',
    'Seinen',
    'Shojo',
    'Shonen',
    'Slice of Life',
    'Sobrenatural',
    'Terror',
    'Thriller',
    'Deportes',
    'Histórico',
    'Ciencia Ficción',
    'Música',
    'Parodia',
  ];

  for (const name of genres) {
    await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`   ✅ ${genres.length} géneros creados\n`);

  // ── 2. RANGOS ─────────────────────────────────────────────────
  console.log('🏆 Creando rangos...');

  const ranks = [
    { name: 'Genin del Anime',         animeReference: 'Naruto',          xpRequired: 0,     sortOrder: 1  },
    { name: 'Estudiante de la UA',      animeReference: 'My Hero Academia', xpRequired: 100,   sortOrder: 2  },
    { name: 'Cazador de Clase D',       animeReference: 'Hunter x Hunter',  xpRequired: 300,   sortOrder: 3  },
    { name: 'Aprendiz de Mago',         animeReference: 'Fairy Tail',       xpRequired: 600,   sortOrder: 4  },
    { name: 'Pirata de Paja',           animeReference: 'One Piece',        xpRequired: 1000,  sortOrder: 5  },
    { name: 'Soldado de la Legión',     animeReference: 'Attack on Titan',  xpRequired: 1500,  sortOrder: 6  },
    { name: 'Ninja de Konoha',          animeReference: 'Naruto Shippuden', xpRequired: 2500,  sortOrder: 7  },
    { name: 'Espada del Alma',          animeReference: 'Bleach',           xpRequired: 4000,  sortOrder: 8  },
    { name: 'Maestro Alquimista',       animeReference: 'Fullmetal',        xpRequired: 6000,  sortOrder: 9  },
    { name: 'Dios del Nuevo Mundo',     animeReference: 'Death Note',       xpRequired: 10000, sortOrder: 10 },
  ];

  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { name: rank.name },
      update: {},
      create: rank,
    });
  }

  console.log(`   ✅ ${ranks.length} rangos creados\n`);

  // ── 3. LOGROS ─────────────────────────────────────────────────
  console.log('🎖️  Creando logros...');

  const achievements = [
    // Episodios vistos
    {
      code: 'EP_1',
      name: 'Primera vez',
      description: 'Viste tu primer episodio en Kuroshi.tv',
      xpReward: 10,
    },
    {
      code: 'EP_10',
      name: 'Calentando',
      description: 'Completaste 10 episodios',
      xpReward: 25,
    },
    {
      code: 'EP_50',
      name: 'Otaku en formación',
      description: 'Completaste 50 episodios',
      xpReward: 75,
    },
    {
      code: 'EP_100',
      name: 'Centenario',
      description: 'Completaste 100 episodios. ¡Nada mal!',
      xpReward: 150,
    },
    {
      code: 'EP_500',
      name: 'Sin vida social',
      description: 'Completaste 500 episodios',
      xpReward: 400,
    },
    {
      code: 'EP_1000',
      name: 'Veterano del Anime',
      description: 'Completaste 1000 episodios. Leyenda.',
      xpReward: 800,
    },
    // Horas
    {
      code: 'HOURS_10',
      name: '10 horas de anime',
      description: 'Llevas 10 horas viendo anime en Kuroshi.tv',
      xpReward: 30,
    },
    {
      code: 'HOURS_100',
      name: '100 horas de anime',
      description: 'Llevas 100 horas invertidas en anime',
      xpReward: 200,
    },
    {
      code: 'HOURS_500',
      name: '500 horas de anime',
      description: 'Medio millar de horas. Eres increíble.',
      xpReward: 600,
    },
    // Comunidades
    {
      code: 'COMMUNITY_1',
      name: 'Social',
      description: 'Te uniste a tu primera comunidad',
      xpReward: 20,
    },
    {
      code: 'COMMUNITY_5',
      name: 'Fanático',
      description: 'Eres miembro de 5 comunidades',
      xpReward: 80,
    },
    {
      code: 'COMMUNITY_CREATED',
      name: 'Fundador',
      description: 'Creaste tu primera comunidad',
      xpReward: 100,
    },
    // Social
    {
      code: 'FRIEND_1',
      name: 'Primera amistad',
      description: 'Hiciste tu primer amigo en Kuroshi.tv',
      xpReward: 15,
    },
    {
      code: 'FRIEND_10',
      name: 'Popular',
      description: 'Tienes 10 amigos en Kuroshi.tv',
      xpReward: 60,
    },
    // Especiales
    {
      code: 'EARLY_ADOPTER',
      name: 'Pionero',
      description: 'Te registraste en los primeros días de Kuroshi.tv',
      xpReward: 200,
    },
    {
      code: 'ANIME_COMPLETED_1',
      name: 'Al final del camino',
      description: 'Completaste tu primer anime',
      xpReward: 50,
    },
    {
      code: 'ANIME_COMPLETED_10',
      name: 'Maratonista',
      description: 'Completaste 10 animes',
      xpReward: 150,
    },
    {
      code: 'COMMENT_FIRST',
      name: 'Voz propia',
      description: 'Escribiste tu primer comentario en un episodio',
      xpReward: 10,
    },
    {
      code: 'POST_FIRST',
      name: 'Autor',
      description: 'Publicaste tu primer post en una comunidad',
      xpReward: 20,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {},
      create: achievement,
    });
  }

  console.log(`   ✅ ${achievements.length} logros creados\n`);

  console.log('✨ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
