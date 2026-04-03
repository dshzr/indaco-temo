/**
 * Conteúdo do preloader (spinner) — o painel roxo e motion ficam em PortfolioExperience.
 */
export function PortfolioPreloader() {
  return (
    <>
      <span className="sr-only">A carregar…</span>
      <div
        className="size-10 rounded-full border-2 border-solid border-white border-t-transparent animate-spin motion-reduce:animate-none"
        aria-hidden
      />
    </>
  );
}
