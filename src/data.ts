import type { Mood } from "./lib/plasma-ui";

/** Defensa en profundidad: solo se aceptan enlaces https (nunca javascript:, data:, etc.). */
export function safeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : "#";
  } catch {
    return "#";
  }
}

export const profile = {
  name: "Daniel Vallejo",
  tags: ["Director Creativo", "Diseñador / WebDev"],
  studio: "Yehiibhii Estudio",
  image: "/images/me.png",
  audio: "/media/welcome3.wav",
  greeting: "¡Di Hola, Escríbenos un Mensaje!",
  description: "Desarrollamos estrategias con herramientas web para promover tus productos y/o servicios.",
  highlight: "Atrévete al cambio",
  email: "holadhan@proton.me",
  footer: "Transformáte a lo Digital",
};

export const links = {
  blog: "https://ybestudio.site",
  telegram: "https://t.me/Dannyveneno",
  web: "https://ybestudio.tech",
  whatsapp: "https://wa.me/5610731990?text=Hola%20me%20interesan%20tus%20servicios%20de%20desarrollo%20web",
  projects: "https://chamandigital.netlify.app/",
};

export const socials = [
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/juanitovenenoestudio/" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/c/DanielVallejojveneno" },
  { id: "facebook", label: "Facebook", href: "https://www.facebook.com/juanitovenenoestudiodigital" },
  { id: "spotify", label: "Spotify", href: "https://open.spotify.com/show/02JMGEAGGkQVFqkngYb4gE?si=0acdb63fca8b4cb7" },
  { id: "behance", label: "Behance", href: "https://www.behance.net/danielvallejo23" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/danielvallejoch/" },
  { id: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@yehiibhiiestudio" },
] as const;

// Mood propio: slate → verde oscuro → lima. Definido fuera de React para mantener la referencia estable.
export const limeMood: Mood = {
  colors: ["#1b2229", "#3f6212", "#84cc16"],
  blend: 22,
  spring: { stiffness: 170, damping: 16 },
};
