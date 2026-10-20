import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy & GDPR",
  description: "General Data Protection Regulation (GDPR) and privacy guidelines for MFSTECH-OpenPedia.",
};

const contentByLocale = {
  pt: {
    title: "Política de Privacidade e Proteção de Dados (RGPD)",
    subtitle: "Em cumprimento do Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho (RGPD).",
    lastUpdated: "Última atualização: 20 de outubro de 2026",
    sections: [
      {
        heading: "1. Responsável pelo Tratamento dos Dados",
        body: "A plataforma MFSTECH-OpenPedia é responsável pelo tratamento dos dados pessoais recolhidos através deste website, assegurando que o tratamento seja realizado de forma lícita, leal e transparente.",
      },
      {
        heading: "2. Dados Pessoais Tratados e Finalidades",
        body: "• Dados de Registo: Nome de utilizador e endereço de email para efeitos de autenticação, proteção contra abusos e atribuição de edições.\n• Histórico de Edições: No espírito de enciclopédia aberta, o nome de utilizador e o histórico de revisões são públicos. Para utilizadores não autenticados, é guardado um hash anonimizado do endereço IP para prevenir vandalismo sem expor o IP real.\n• Preferências de Navegação: Idioma selecionado e tema (claro/escuro) armazenados localmente.",
      },
      {
        heading: "3. Base Legal para o Tratamento (Artigo 6.º do RGPD)",
        body: "• Execução de Contrato e Prestação do Serviço (Art. 6.1.b) para gestão de contas e registo de artigos.\n• Interesses Legítimos (Art. 6.1.f) para proteção da integridade da enciclopédia contra vandalismo, spambots e ataques de negação de serviço.\n• Consentimento (Art. 6.1.a) para cookies analíticos e preferências opcionais.",
      },
      {
        heading: "4. Direitos dos Titulares dos Dados",
        body: "Nos termos do RGPD, tem o direito de:\n• Solicitar o acesso aos seus dados pessoais guardados;\n• Retificar informações incorretas ou desatualizadas;\n• Solicitar a eliminação da sua conta pessoal;\n• Opor-se ao tratamento dos seus dados ou solicitar a sua limitação;\n• Solicitar a portabilidade dos seus dados em formato estruturado.",
      },
      {
        heading: "5. Segurança e Armazenamento",
        body: "Todos os dados transmitidos utilizam encriptação SSL/TLS de ponta a ponta. As palavras-passe são protegidas por funções criptográficas seguras (hashing irreversível com salt) e a base de dados reside em infraestrutura com certificação de segurança europeia.",
      },
    ],
  },
  en: {
    title: "Privacy Policy & Data Protection (GDPR)",
    subtitle: "In compliance with Regulation (EU) 2016/679 of the European Parliament and of the Council (GDPR).",
    lastUpdated: "Last updated: October 20, 2026",
    sections: [
      {
        heading: "1. Data Controller",
        body: "MFSTECH-OpenPedia is the data controller for the processing of personal data collected through this platform, ensuring lawful, fair, and transparent processing.",
      },
      {
        heading: "2. Personal Data Processed & Purposes",
        body: "• Registration Details: Username and email address for authentication, abuse prevention, and edit attribution.\n• Edit History: In the spirit of an open encyclopedia, usernames and revision history are public. For anonymous edits, a cryptographic hash of the IP address is stored to mitigate spam without revealing the actual IP.\n• Browsing Preferences: Selected language and theme (light/dark) stored client-side.",
      },
      {
        heading: "3. Legal Basis for Processing (Article 6 GDPR)",
        body: "• Performance of a Contract (Art. 6.1.b) for account maintenance and editorial contributions.\n• Legitimate Interests (Art. 6.1.f) to protect community content from vandalism, bot abuse, and denial-of-service attacks.\n• Consent (Art. 6.1.a) for non-essential cookies and analytics preferences.",
      },
      {
        heading: "4. Data Subject Rights",
        body: "Under GDPR, you have the right to:\n• Access your personal data;\n• Rectify inaccurate or incomplete data;\n• Request erasure of your user account;\n• Restrict or object to data processing;\n• Request data portability in a standard structured format.",
      },
      {
        heading: "5. Security & Storage",
        body: "All transmissions are encrypted via modern TLS/SSL protocols. Passwords are salted and hashed irreversibly, and databases operate on isolated, highly secure cloud infrastructure.",
      },
    ],
  },
  es: {
    title: "Política de Privacidad y Protección de Datos (RGPD)",
    subtitle: "En conformidad con el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD).",
    lastUpdated: "Última actualización: 20 de octubre de 2026",
    sections: [
      {
        heading: "1. Responsable del Tratamiento",
        body: "MFSTECH-OpenPedia es responsable del tratamiento de los datos personales recogidos en esta plataforma, garantizando un tratamiento lícito, leal y transparente.",
      },
      {
        heading: "2. Datos Personales Tratados y Finalidades",
        body: "• Registro: Nombre de usuario y correo para autenticación y atribución de ediciones.\n• Historial: Las contribuciones son públicas. Para usuarios anónimos se almacena un hash del IP para prevenir vandalismo sin almacenar el IP real.\n• Preferencias: Idioma y tema almacenados localmente.",
      },
      {
        heading: "3. Base Legal del Tratamiento",
        body: "• Ejecución de servicio (Art. 6.1.b).\n• Interés legítimo (Art. 6.1.f) para la seguridad y control de abusos.\n• Consentimiento (Art. 6.1.a) para preferencias opcionales.",
      },
      {
        heading: "4. Derechos de los Usuarios",
        body: "Acceso, rectificación, supresión, limitación del tratamiento, oposición y portabilidad de sus datos personales.",
      },
      {
        heading: "5. Seguridad",
        body: "Transmisiones cifradas vía TLS/SSL y contraseñas protegidas mediante algoritmos criptográficos irreversibles.",
      },
    ],
  },
  fr: {
    title: "Politique de Confidentialité et Protection des Données (RGPD)",
    subtitle: "Conformément au Règlement (UE) 2016/679 du Parlement européen et du Conseil (RGPD).",
    lastUpdated: "Dernière mise à jour : 20 octobre 2026",
    sections: [
      {
        heading: "1. Responsable du Traitement",
        body: "MFSTECH-OpenPedia est le responsable du traitement des données personnelles collectées via cette plateforme.",
      },
      {
        heading: "2. Données Traitées et Finalités",
        body: "• Inscription : Nom d'utilisateur et email pour l'authentification et l'attribution des modifications.\n• Historique : Les modifications sont publiques. Pour les modifications anonymes, un hachage anonymisé de l'adresse IP est conservé.\n• Préférences : Langue et thème enregistrés localement.",
      },
      {
        heading: "3. Base Juridique du Traitement",
        body: "• Exécution d'un contrat (Art. 6.1.b).\n• Intérêt légitime (Art. 6.1.f) pour la sécurité et la prévention du vandalisme.\n• Consentement (Art. 6.1.a) pour les préférences personnalisées.",
      },
      {
        heading: "4. Droits des Personnes Concernées",
        body: "Droit d'accès, de rectification, d'effacement, de limitation du traitement, d'opposition et de portabilité des données.",
      },
      {
        heading: "5. Sécurité",
        body: "Chiffrement SSL/TLS de bout en bout et stockage sécurisé des mots de passe.",
      },
    ],
  },
  it: {
    title: "Informativa sulla Privacy e Protezione dei Dati (GDPR)",
    subtitle: "In conformità con il Regolamento (UE) 2016/679 del Parlamento Europeo e del Consiglio (GDPR).",
    lastUpdated: "Ultimo aggiornamento: 20 ottobre 2026",
    sections: [
      {
        heading: "1. Titolare del Trattamento",
        body: "MFSTECH-OpenPedia è il titolare del trattamento dei dati personali raccolti tramite questa piattaforma.",
      },
      {
        heading: "2. Dati Trattati e Finalità",
        body: "• Dati di Registrazione: Nome utente ed email per autenticazione e attribuzione delle modifiche.\n• Cronologia Modifiche: I contributi sono pubblici. Per le modifiche anonime, viene memorizzato un hash crittografico dell'IP.\n• Preferenze: Lingua e tema memorizzati localmente.",
      },
      {
        heading: "3. Base Giuridica del Trattamento",
        body: "• Esecuzione di un contratto (Art. 6.1.b).\n• Legittimo interesse (Art. 6.1.f) per la prevenzione di abusi e vandalismo.\n• Consenso (Art. 6.1.a) per preferenze opzionali.",
      },
      {
        heading: "4. Diritti dell'Interessato",
        body: "Diritto di accesso, rettifica, cancellazione, limitazione del trattamento, opposizione e portabilità dei dati.",
      },
      {
        heading: "5. Sicurezza",
        body: "Connessioni crittografate TLS/SSL e password archiviate con funzioni di hash crittografiche sicure.",
      },
    ],
  },
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const c = contentByLocale[locale] ?? contentByLocale.en;

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <header className="border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          {c.title}
        </h1>
        <p className="mt-2 text-base text-muted">{c.subtitle}</p>
        <p className="mt-1 text-xs text-muted">{c.lastUpdated}</p>
      </header>

      <div className="space-y-6">
        {c.sections.map((sec, idx) => (
          <section key={idx} className="card p-6">
            <h2 className="font-serif text-xl font-semibold text-accent mb-3">
              {sec.heading}
            </h2>
            <div className="text-sm leading-relaxed whitespace-pre-line text-ink/90">
              {sec.body}
            </div>
          </section>
        ))}
      </div>

      <div className="card p-6 bg-accent/5 border-accent/30 text-center">
        <p className="text-sm text-muted">
          MFSTECH-OpenPedia ·{" "}
          <Link href="/" className="text-accent underline font-medium">
            Voltar à página inicial / Back to home
          </Link>
        </p>
      </div>
    </article>
  );
}
