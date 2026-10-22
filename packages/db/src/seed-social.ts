import { db, pool } from "./client";
import { socialPosts, socialComments } from "./schema";
import { eq } from "drizzle-orm";

async function seedSocial() {
  console.log("Seeding MFSTECH SOCIAL posts and comments...");

  try {
    const existing = await db.select({ id: socialPosts.id }).from(socialPosts);
    if (existing.length > 0) {
      console.log(`MFSTECH SOCIAL already has ${existing.length} posts seeded.`);
      return;
    }

    // 1. Post com Vídeo do YouTube
    const [ytPost] = await db
      .insert(socialPosts)
      .values({
        authorName: "MFSTECH Oficial",
        authorEmail: "mfstechsocial@gmail.com",
        title: "Apresentação de Tecnologia & Arquitetura Web Moderna",
        content:
          "Sejam bem-vindos ao **MFSTECH SOCIAL**! Nesta publicação de destaque, apresentamos a nossa arquitetura completa com Next.js 15, React 19 e PostgreSQL serverless.\n\nAssista ao vídeo diretamente aqui no nosso player integrado ou use o botão para abrir no YouTube oficial!",
        mediaType: "youtube",
        youtubeVideoId: "ScMzIvxBSi4",
        youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
        likesCount: 24,
        commentsCount: 2,
      })
      .returning();

    if (ytPost) {
      await db.insert(socialComments).values([
        {
          postId: ytPost.id,
          authorName: "Carlos Silva",
          authorEmail: "carlos.silva@exemplo.com",
          content: "Sensacional! O player executa diretamente dentro do site e o link para o YouTube funciona perfeitamente.",
          likesCount: 5,
        },
        {
          postId: ytPost.id,
          authorName: "Mariana Costa",
          authorEmail: "mariana.costa@exemplo.com",
          content: "Design muito profissional e rápido. Parabéns à equipa MFSTECH!",
          likesCount: 3,
        },
      ]);
    }

    // 2. Post com Álbum do Google Fotos
    const [photosPost] = await db
      .insert(socialPosts)
      .values({
        authorName: "Equipa Multimédia MFSTECH",
        authorEmail: "mfstechsocial@gmail.com",
        title: "Galeria de Fotos Oficiais da Comunidade & Eventos",
        content:
          "Partilhamos os registos e fotografias dos nossos eventos técnicos e encontros da comunidade. O álbum completo está acessível pelo Google Fotos através do link direto abaixo.",
        mediaType: "google_photos",
        googlePhotosUrl: "https://photos.app.goo.gl/MFSTECH-Community-Album",
        googlePhotosTitle: "Álbum Oficial de Eventos e Infraestrutura MFSTECH",
        likesCount: 18,
        commentsCount: 1,
      })
      .returning();

    if (photosPost) {
      await db.insert(socialComments).values([
        {
          postId: photosPost.id,
          authorName: "Pedro Alves",
          authorEmail: "pedro.alves@exemplo.com",
          content: "Excelente integração de imagens com o Google Fotos! Visual limpo e muito prático.",
          likesCount: 2,
        },
      ]);
    }

    // 3. Post Institucional e Suporte
    const [infoPost] = await db
      .insert(socialPosts)
      .values({
        authorName: "Suporte MFSTECH",
        authorEmail: "mfstechsocial@gmail.com",
        title: "Canais Oficiais de Atendimento e Liberdade de Publicação",
        content:
          "O **MFSTECH SOCIAL** é um espaço aberto para partilhar conhecimento, vídeos e fotos.\n\nPara parcerias, sugestões ou suporte técnico, contacte-nos através do e-mail oficial: **mfstechsocial@gmail.com**.",
        mediaType: "none",
        likesCount: 31,
        commentsCount: 1,
      })
      .returning();

    if (infoPost) {
      await db.insert(socialComments).values([
        {
          postId: infoPost.id,
          authorName: "Ana Martins",
          authorEmail: "ana.martins@exemplo.com",
          content: "Email oficial anotado: mfstechsocial@gmail.com. Excelente plataforma!",
          likesCount: 4,
        },
      ]);
    }

    console.log("MFSTECH SOCIAL seeded successfully!");
  } catch (err) {
    console.error("Error seeding social:", err);
    process.exit(0);
  }
}

seedSocial();
