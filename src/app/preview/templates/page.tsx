import { HTML_TEMPLATES, FORMAT_DIMS } from "@/lib/rendering/template-registry";

const SAMPLE_PROPS = {
  "yc-contrarian-take": {
    title: "Dejá de contratar fábricas que diseñan pantallas. Necesitás product judgment.",
    subtitle: "product judgment",
  },
  "yc-process-step": {
    title: "Understand",
    body_text: "Antes que exista un solo pixel, mapeamos usuarios, problema y dirección. Sin atajos.",
    slide: { index: 1, kind: "content" as const },
  },
  "yc-faq-card": {
    title: "¿Pueden trabajar con nuestro equipo interno?",
    body_text: "Sí. Nos integramos directo con founders, devs y product. Sin pisarse, sin reuniones de mil personas.",
  },
  "yc-reframe": {
    subtitle: "La interfaz no es el punto de partida.",
    title: "Es el resultado.",
  },
  "yc-manifesto-block": {
    title: "Diseñamos, construimos y escalamos productos B2B SaaS.",
    body_text: "Sin equipos inflados. Sin proyectos eternos sin dirección. Just sharp execution de gente que se obsesiona por outcomes.",
  },
};

export default function PreviewTemplatesPage() {
  const slugs = Object.keys(HTML_TEMPLATES);

  return (
    <div className="p-12 max-w-7xl">
      <h1 className="font-display text-5xl uppercase tracking-tight mb-2">Preview · Templates</h1>
      <p className="text-[var(--text-dim)] mb-8 text-sm">
        Renders en vivo de los templates HTML con datos de muestra. Útil para iterar visualmente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {slugs.map((slug) => {
          const fn = HTML_TEMPLATES[slug];
          const dims = FORMAT_DIMS.ig_feed;
          const props = SAMPLE_PROPS[slug as keyof typeof SAMPLE_PROPS] ?? {};
          const html = fn({ width: dims.width, height: dims.height, ...props });
          // Encode as data url for iframe preview
          const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
          return (
            <div key={slug} className="card overflow-hidden">
              <iframe
                src={dataUrl}
                className="w-full aspect-square bg-black"
                style={{ border: "none" }}
              />
              <div className="p-4">
                <code className="text-sm">{slug}</code>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
