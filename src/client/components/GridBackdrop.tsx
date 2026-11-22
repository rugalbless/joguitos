// Fundo do site: uma gradezinha fina na cor das linhas do tema, mais visível no meio da tela e
// sumindo nas bordas. É só CSS (não pesa nada) e fica parada enquanto a página rola por cima.

export function GridBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_85%)]"
      aria-hidden
    />
  );
}
