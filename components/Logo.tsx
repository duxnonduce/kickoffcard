export default function Logo({ size = "md", align = "center" }: { size?: "sm" | "md" | "lg"; align?: "center" | "left" }) {
  // Header/nav compatti: lockup orizzontale su verde, più leggero.
  // Hero/login: lockup largo su nero, più d'impatto.
  const heights: Record<string, number> = { sm: 28, md: 40, lg: 64 };
  const h = heights[size];

  if (align === "left") {
    return (
      <img
        src="/logo-wordmark-green.png"
        alt="Kickoff Sport Center"
        style={{ height: h, width: "auto" }}
        className="rounded-md"
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src="/logo-wordmark-dark.png"
        alt="Kickoff Sport Center"
        style={{ height: h, width: "auto" }}
        className="rounded-lg"
      />
      <div className="text-ko-line/45 text-[11px] tracking-[0.2em] uppercase">Portale Card Fedeltà</div>
    </div>
  );
}
