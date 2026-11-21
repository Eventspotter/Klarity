// Adapted from Wren by LN (MIT): ln-dev7/landing-pages, components/wren.tsx.
import { useEffect, useMemo, useState } from "react";
const typedPhrases = ["on-brand.", "accurate.", "consistent.", "yours."];
export function Typed() {
  const [i, setI] = useState(0);
  const [n, setN] = useState(typedPhrases[0].length);
  const [phase, setPhase] = useState("hold");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const word = typedPhrases[i];
    let t;
    if (phase === "hold") t = setTimeout(() => setPhase("erase"), 2600);
    else if (phase === "erase") {
      if (n > 0) t = setTimeout(() => setN(n - 1), 34);
      else t = setTimeout(() => {
        setI((i + 1) % typedPhrases.length);
        setPhase("type");
      }, 220);
    } else {
      if (n < word.length) t = setTimeout(() => setN(n + 1), 62);
      else setPhase("hold");
    }
    return () => clearTimeout(t);
  }, [i, n, phase]);
  return <span className="typed">{typedPhrases.map((p) => <em key={p} className="typed-ghost" aria-hidden="true">{p}</em>)}<em className="typed-live" aria-hidden="true">{typedPhrases[i].slice(0, n)}<span className="typed-caret" /></em></span>;
}
export function Contours() {
  const paths = useMemo(() => {
    const out = [];
    const N = 14;
    for (let k = 0; k < 12; k++) {
      const r0 = 46 + k * 40;
      const cx = 640 - k * 9;
      const cy = 330 + k * 5;
      const pts = [];
      for (let j = 0; j < N; j++) {
        const a = j / N * Math.PI * 2;
        const r = r0 * (1 + 0.16 * Math.sin(3 * a + k * 0.45) + 0.08 * Math.sin(5 * a + 1.3 + k * 0.28));
        pts.push([cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 0.82]);
      }
      let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let j = 0; j < N; j++) {
        const p0 = pts[(j - 1 + N) % N], p1 = pts[j], p2 = pts[(j + 1) % N], p3 = pts[(j + 2) % N];
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      out.push(d + "Z");
    }
    return out;
  }, []);
  return <svg className="contours" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g>{paths.map((d, k) => <path key={k} d={d} pathLength={1} data-major={k % 4 === 3 || void 0} style={{ ["--k"]: k }} />)}</g></svg>;
}
export function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll(".klarity-landing [data-reveal]");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.dataset.visible = "true");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.dataset.visible = "true";
          io.unobserve(e.target);
        }
      }),
      { rootMargin: "0px 0px -12% 0px" }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
