import type { ReactNode } from "react";
import {
  FaAward,
  FaBehance,
  FaBookmark,
  FaFacebook,
  FaGlobe,
  FaHandshake,
  FaInstagram,
  FaLinkedin,
  FaPalette,
  FaRss,
  FaSpotify,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";
import { Plasma, PlasmaProvider } from "./lib/plasma-ui";
import AudioAvatar from "./components/AudioAvatar";
import ExtLink, { extProps } from "./components/ExtLink";
import { limeMood, links, profile, socials } from "./data";

const touch =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

const socialIcons: Record<string, ReactNode> = {
  instagram: <FaInstagram />,
  youtube: <FaYoutube />,
  facebook: <FaFacebook />,
  spotify: <FaSpotify />,
  behance: <FaBehance />,
  linkedin: <FaLinkedin />,
  tiktok: <FaTiktok />,
};

const cta =
  "flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-1 rounded-xl p-1 text-[clamp(9px,2.5vw,11px)] font-semibold leading-tight text-white no-underline transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime [&>svg]:shrink-0 [&>svg]:text-[clamp(16px,4vw,20px)]";
const actionBtn =
  "grid h-[45px] w-[45px] place-items-center rounded-full bg-ink text-base text-lime shadow-[0_5px_15px_rgba(0,0,0,.3)] transition duration-300 hover:-translate-y-[3px]";

export default function App() {
  return (
    <PlasmaProvider
      mood={limeMood}
      theme='dark'
      radius={26}
      viscosity={0.55}
      grain={0.6}
      highlight={0.8}
      rim={0.8}
      quality={touch ? 1 : 1.25} // la librería es pesada en GPU: menos resolución en táctil
      freezeOnScroll={touch}
    >
      <main className='flex min-h-screen justify-center px-5 pb-10 pt-7'>
        <div className='m-auto w-full max-w-[400px]'>
          {/* Header + perfil: dos paneles pegados que Plasma funde en un solo cuerpo */}
          <Plasma
            as='header'
            radius={28}
            tint='#84cc16'
            opacity={0.78}
            frost={0.15}
            elevation={0.5}
            className='h-[280px]'
          >
            <div className='flex h-full flex-col justify-between px-[25px] py-[30px]'>
              <div className='flex items-start justify-between text-lg text-white/85'>
                <FaBookmark aria-hidden /> <FaAward aria-hidden />
              </div>
              <div>
                <h1 className='mb-2 text-2xl font-bold text-ink sm:text-[28px]'>
                  {profile.name}
                </h1>
                <div className='mb-5 flex flex-wrap gap-2'>
                  {profile.tags.map((t) => (
                    <span
                      key={t}
                      className='rounded-full bg-black/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[.5px] text-white'
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className='mb-[45px] inline-block rounded-full bg-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[1px] text-ink'>
                  {profile.studio}
                </div>
              </div>
            </div>
          </Plasma>

          <Plasma
            as='section'
            radius={28}
            tint='#1b2229'
            opacity={0.42}
            frost={0.35}
            elevation={0.5}
            className='flow-root px-[25px] pb-2'
          >
            <AudioAvatar
              src={profile.audio}
              image={profile.image}
              alt={profile.name}
            />

            <div className='absolute -top-[25px] right-[25px] z-[2] flex gap-2.5'>
              <a
                {...extProps(links.blog)}
                className={actionBtn}
                aria-label='Blog'
              >
                <FaRss />
              </a>
              <a
                {...extProps(links.telegram)}
                className={actionBtn}
                aria-label='Telegram'
              >
                <FaTelegram />
              </a>
            </div>

            <div className='mb-[22px] mt-5 text-center'>
              <p className='mb-2 text-sm font-semibold'>{profile.greeting}</p>
              <p className='text-[13px] leading-relaxed text-white/90'>
                {profile.description} <strong>{profile.highlight}</strong>
              </p>
            </div>
          </Plasma>

          {/* Contacto: separado más que la distancia de fusión, queda independiente */}
          <Plasma
            as='section'
            radius={22}
            tint='#1b2229'
            opacity={0.38}
            frost={0.4}
            elevation={0.4}
            className='mt-10 p-5 text-center'
          >
            <h2 className='mb-3.5 text-sm font-semibold'>
              Información de Contacto
            </h2>
            <p className='mb-4 text-xs text-white/90'>{profile.email}</p>
            <div className='grid w-full grid-cols-4 gap-2'>
              <ExtLink
                href={links.web}
                className={`${cta} bg-gradient-to-br from-lime to-lime-dark shadow-[0_4px_15px_rgba(132,204,22,.3)]`}
              >
                <FaGlobe aria-hidden /> <span>Visitar Sitio Web</span>
              </ExtLink>
              <ExtLink
                href={links.whatsapp}
                className={`${cta} bg-gradient-to-br from-gray-500 to-ink shadow-[0_4px_15px_rgba(107,114,128,.3)]`}
              >
                <FaWhatsapp aria-hidden /> <span>WhatsApp</span>
              </ExtLink>
              <ExtLink
                href={links.projects}
                className={`${cta} bg-gradient-to-br from-lime to-lime-dark shadow-[0_4px_15px_rgba(132,204,22,.3)]`}
              >
                <FaHandshake aria-hidden /> <span>Líder de Proyectos</span>
              </ExtLink>
              <ExtLink
                href={links.studio}
                className={`${cta} bg-gradient-to-br from-gray-500 to-ink shadow-[0_4px_15px_rgba(107,114,128,.3)]`}
              >
                <FaPalette aria-hidden /> <span>YB Estudio</span>
              </ExtLink>
            </div>
          </Plasma>

          {/* Redes: gotas a menos de `blend` de distancia → Plasma las une en una cadena líquida */}
          <nav
            aria-label='Redes sociales'
            className='mt-10 flex justify-center gap-2.5'
          >
            {socials.map((s) => (
              <Plasma
                key={s.id}
                {...extProps(s.href)}
                as='a'
                draggable={false}
                aria-label={s.label}
                radius={20}
                tint='#ffffff'
                opacity={0.12}
                elevation={0.3}
                lean={5}
                className='grid aspect-square max-w-[42px] flex-[0_1_42px] place-items-center text-base text-white no-underline transition-colors duration-300 hover:text-lime'
              >
                {socialIcons[s.id]}
              </Plasma>
            ))}
          </nav>

          <p className='mt-[26px] text-center text-xs font-semibold text-white/75'>
            {profile.footer}
          </p>
        </div>
      </main>
    </PlasmaProvider>
  );
}
