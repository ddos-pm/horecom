import type { MetadataRoute } from "next";

/**
 * PWA manifest. Icons live in public/ at stable URLs so the manifest can
 * reference them — Next's app/icon.png convention uses hashed URLs that
 * wouldn't survive being copied into a PWA install record.
 *
 * Theme color matches the orange brand mark for the chrome tint shown
 * around the address bar / app shell when installed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Horecom — B2B оптовая платформа",
    short_name: "Horecom",
    description: "Оптовая поставка ингредиентов для HoReCa в Астане",
    start_url: "/ru",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F18305",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
