export interface PortfolioProject {
  slug: string;
  /** Linha pequena opcional por cima do título (ex.: parceria). */
  brandLockup: string;
  /** Primeira linha do título (palavras em branco/preto conforme fundo). */
  detailTitleLine1: string;
  /** Frase com o mesmo efeito “marcador” da index (fund `--indaco`). */
  detailHighlight: string;
  /** Linha de tags / serviços (caps). */
  tagsLine: string;
  coverSrc: string;
  logoSrc: string;
  posterSrc: string;
  videoSrc: string;
  /** Parágrafo introdutório; use **texto** para negrito. */
  introMarkdown: string;
  services: string[];
  impactTitle: string;
  impactMarkdown: string;
  /** Slugs de outros projetos na grelha “Related”. */
  relatedSlugs: string[];
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "pollini",
    brandLockup: "INDACO X POLLINI",
    detailTitleLine1: "The power of year-round digital advertising",
    detailHighlight: "Always on",
    tagsLine: "DIGITAL + CAMPAIGN + CONTENT",
    coverSrc: "/images/portfolio/pollini-cover.webp",
    logoSrc: "/images/portfolio/pollini-logo.png",
    posterSrc: "/images/portfolio/pollini-cover.webp",
    videoSrc: "/videos/bg-intro.mp4",
    introMarkdown:
      "Um ecossistema **digital contínuo** que acompanha a temporada, reforça a presença da marca e transforma cada ponto de contacto num momento de narrativa coerente com o universo **Pollini**.",
    services: [
      "DIGITAL STRATEGY",
      "CAMPAIGN",
      "CONTENT PRODUCTION",
      "SOCIAL ASSETS",
      "MEDIA BUY",
    ],
    impactTitle: "Our impact",
    impactMarkdown:
      "Construímos uma presença **sempre ativa** que liga campanhas sazonais a conteúdo evergreen — do estúdio ao feed, com métricas claras e criatividade constante. A equipa **Indaco** gere produção, pós-produção e distribuição para manter o brand storytelling alinhado em todos os mercados.",
    relatedSlugs: ["dorelan", "pagani", "redbull"],
  },
  {
    slug: "dorelan",
    brandLockup: "INDACO X DORELAN",
    detailTitleLine1: "Entra in modalità Dorelan",
    detailHighlight: "Sleep elevated",
    tagsLine: "CREATIVE + PRODUCTION + VIDEO",
    coverSrc: "/images/portfolio/dorelan-cover.webp",
    logoSrc: "/images/portfolio/dorelan-logo.png",
    posterSrc: "/images/portfolio/dorelan-cover.webp",
    videoSrc: "/videos/hello-sphere.mp4",
    introMarkdown:
      "Uma narrativa sensorial em vídeo que traduz o conforto **Dorelan** em imagem, som e ritmo — do conceito ao set, com direção que honra o legacy italiano do descanso.",
    services: [
      "CREATIVE DIRECTION",
      "PRODUCTION",
      "VIDEO",
      "PHOTOGRAPHY",
      "POST-PRODUCTION",
    ],
    impactTitle: "Our impact",
    impactMarkdown:
      "O filme consolidou **Dorelan** como referência premium em sleeping — com tom emocional consistente em TV, digital e retail. Produção **Indaco** end-to-end: casting, locação, grading e master para multi-canal.",
    relatedSlugs: ["pollini", "adidas", "pagani"],
  },
  {
    slug: "pagani",
    brandLockup: "INDACO X PAGANI",
    detailTitleLine1: "Sono i sognatori a muovere il mondo",
    detailHighlight: "Hyperformance",
    tagsLine: "CONCEPT + DIRECTION + PRODUCTION",
    coverSrc: "/images/portfolio/pagani-cover.webp",
    logoSrc: "/images/portfolio/pagani-logo.png",
    posterSrc: "/images/portfolio/pagani-cover.webp",
    videoSrc: "/videos/bg-intro.mp4",
    introMarkdown:
      "Um manifesto visual para **Pagani**: velocidade, artesanato e futuro reunidos em frames de alta precisão — da concept art à entrega master.",
    services: [
      "CONCEPT",
      "DIRECTION",
      "PRODUCTION",
      "CGI SUPPORT",
      "COLOR GRADING",
    ],
    impactTitle: "Our impact",
    impactMarkdown:
      "Ampliamos o universo da marca com uma peça **cinemática** que circulou em eventos exclusivos e digital premium. Direção criativa e produção **Indaco** alinhadas ao padrão obsessive da **Pagani**.",
    relatedSlugs: ["redbull", "pollini", "adidas"],
  },
  {
    slug: "redbull",
    brandLockup: "INDACO X RED BULL",
    detailTitleLine1: "Redbull 64 Bars Live",
    detailHighlight: "Live energy",
    tagsLine: "LIVE + PRODUCTION + DIRECTION",
    coverSrc: "/images/portfolio/redbull-cover.webp",
    logoSrc: "/images/portfolio/redbull-logo.png",
    posterSrc: "/images/portfolio/redbull-cover.webp",
    videoSrc: "/videos/hello-sphere.mp4",
    introMarkdown:
      "Transmissão e produção ao vivo que coloca **64 Bars** no epicentro da cultura hip-hop — multicâmara, áudio broadcast e direção para redes e venue.",
    services: [
      "LIVE STREAMING",
      "PRODUCTION",
      "LIVE DIRECTION",
      "REMOTE PRODUCTION",
      "BROADCAST AUDIO",
    ],
    impactTitle: "Our impact",
    impactMarkdown:
      "Entregámos um live **impecável** com milhares de viewers em tempo real — da cue stack ao encoding, com fallback e monitoring contínuos. A **Indaco** coordenou crew, REMI e pós-live highlights.",
    relatedSlugs: ["adidas", "pollini", "dorelan"],
  },
  {
    slug: "adidas",
    brandLockup: "INDACO X ADIDAS",
    detailTitleLine1: "Ritratto di famiglia",
    detailHighlight: "Collective motion",
    tagsLine: "DIRECTION + FILMING + SET DESIGN",
    coverSrc: "/images/portfolio/adidas-cover.webp",
    logoSrc: "/images/portfolio/adidas-logo.png",
    posterSrc: "/images/portfolio/adidas-cover.webp",
    videoSrc: "/videos/bg-intro.mp4",
    introMarkdown:
      "Um retrato íntimo da família desportiva **Adidas** — set design minimal, luz natural e direção que privilegia gesto e verdade em cada plano.",
    services: [
      "DIRECTION",
      "FILMING",
      "SET DESIGN",
      "ART BUYING",
      "EDITORIAL CUT DOWNS",
    ],
    impactTitle: "Our impact",
    impactMarkdown:
      "A campanha ganhou versões para **Europa** e social, com tom consistente e rápido turnaround. Produção **Indaco** integrou stills e motion num único fluxo.",
    relatedSlugs: ["pagani", "redbull", "pollini"],
  },
];

export const portfolioProjectSlugs = portfolioProjects.map((p) => p.slug);

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return portfolioProjects.find((p) => p.slug === slug);
}

export function getRelatedProjects(
  slug: string,
): PortfolioProject[] {
  const p = getProjectBySlug(slug);
  if (!p) return [];
  return p.relatedSlugs
    .map((s) => getProjectBySlug(s))
    .filter((x): x is PortfolioProject => x != null);
}
