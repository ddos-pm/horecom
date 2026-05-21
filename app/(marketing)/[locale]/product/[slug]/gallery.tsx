"use client";

import { useState } from "react";
import Image from "next/image";

export function Gallery({ images, alt, badges }: { images: string[]; alt: string; badges?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div className="gallery">
      <div className="gallery-thumbs">
        {images.slice(0, 4).map((src, i) => (
          <button
            type="button"
            key={src}
            className={`thumb${i === active ? " active" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Фото ${i + 1}`}
          >
            <Image src={src} alt="" fill sizes="100px" />
          </button>
        ))}
        {images.length > 4 && (
          <div
            className="thumb"
            style={{ background: "var(--c-bg-muted)", color: "var(--c-fg-3)", fontSize: 11, fontWeight: 600 }}
          >
            + {images.length - 4}
          </div>
        )}
      </div>
      <div className="gallery-main">
        {badges && <div className="gallery-badges">{badges}</div>}
        {main && <Image src={main} alt={alt} fill sizes="(max-width: 768px) 100vw, 580px" priority />}
      </div>
    </div>
  );
}
