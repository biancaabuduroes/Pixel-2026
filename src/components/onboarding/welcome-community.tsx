/** Figma B1.1c illustration (node 168:12885), assembled from the exported pieces. */
const PIECES: { src: string; inset: string; pad?: string }[] = [
  { src: "group", inset: "16.21% 69.24% 70.65% 24.07%" },
  { src: "vector", inset: "22.57% 67.13% 73.95% 30.38%" },
  { src: "vector-1", inset: "52.81% 67.73% 5.07% 6.9%" },
  { src: "vector-2", inset: "45.98% 53.83% 5.07% 22.93%" },
  { src: "vector-3", inset: "45.98% 37.8% 11.91% 36.83%" },
  { src: "vector-4", inset: "39.14% 23.9% 11.91% 52.86%" },
  { src: "vector-5", inset: "53.41% 31.63% 35.65% 57.43%" },
  { src: "vector-6", inset: "13.55% 42.56% 54.61% 27.79%" },
  { src: "vector-7", inset: "24.15% 2.18% 19.27% 60.79%" },
  { src: "vector-8", inset: "78.83% 77.75% 15.8% 16.88%", pad: "-6.73%" },
  { src: "group-1", inset: "13.6% 48.65% 74.6% 34.55%" },
  { src: "group-2", inset: "19.83% 58.99% 79.1% 40.22%" },
  { src: "group-3", inset: "4.74% 48.61% 79.44% 21.97%" },
  { src: "group-4", inset: "18.76% 49.66% 66.07% 41.21%" },
  { src: "group-5", inset: "32.26% 52.94% 62.17% 41.18%" },
  { src: "vector-9", inset: "18.02% 33.64% 75.13% 50.76%" },
  { src: "vector-10", inset: "28.55% 68.5% 52.3% 26.7%" },
  { src: "vector-11", inset: "67.68% 28.79% 29.17% 65.89%" },
  { src: "vector-12", inset: "71.31% 27.74% 25.54% 66.93%" },
  { src: "vector-13", inset: "74.45% 26.05% 22.4% 68.63%" },
  { src: "group-6", inset: "38.05% 72.25% 19.27% 2.73%" },
  { src: "vector-14", inset: "60.86% 87.95% 34.25% 9.08%" },
  { src: "group-7", inset: "24.77% 64.58% 73.76% 33.94%" },
  { src: "vector-15", inset: "19.57% 66.7% 79.29% 31.35%" },
  { src: "vector-16", inset: "20.73% 70.11% 78.58% 28.14%" },
  { src: "group-8", inset: "21.58% 66.53% 77.42% 32.51%" },
  { src: "group-9", inset: "22.51% 69.96% 76.49% 29.09%" },
  { src: "vector-17", inset: "45.98% 42.54% 32.64% 36.83%" },
  { src: "vector-18", inset: "55.25% 60.84% 43.83% 38.95%" },
  { src: "vector-19", inset: "80.84% 70% 15% 18.59%" },
  { src: "vector-20", inset: "55.63% 33.86% 37.88% 59.65%", pad: "-5.58%" },
  { src: "vector-21", inset: "54.13% 60.84% 15% 29.53%" },
  { src: "vector-22", inset: "54.07% 42.08% 30.63% 38.69%" },
  { src: "vector-23", inset: "63.08% 36.01% 30.66% 57.46%" },
  { src: "vector-24", inset: "53.52% 96.58% 45.73% 2.17%" },
  { src: "vector-25", inset: "48.57% 93.41% 50.09% 5.64%" },
  { src: "vector-26", inset: "47.28% 89.05% 50.98% 10%" },
  { src: "vector-27", inset: "10.65% 54.99% 87.13% 28.63%" },
];

export function WelcomeCommunity() {
  return (
    <div className="relative size-[301px] shrink-0" aria-hidden>
      {PIECES.map((piece) => (
        <div key={piece.src} className="absolute" style={{ inset: piece.inset }}>
          {piece.pad ? (
            <div className="absolute" style={{ inset: piece.pad }}>
              <img alt="" src={`/figma/welcome-community/${piece.src}.svg`} className="block size-full max-w-none" />
            </div>
          ) : (
            <img alt="" src={`/figma/welcome-community/${piece.src}.svg`} className="absolute inset-0 block size-full max-w-none" />
          )}
        </div>
      ))}
    </div>
  );
}
