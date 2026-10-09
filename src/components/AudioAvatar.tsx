import { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa6";
import { usePlasmaRuntime } from "../lib/plasma-ui";

type Props = { src: string; image: string; alt: string };

/** Avatar con tap play / stop del saludo y una onda líquida de Plasma al tocarlo. */
export default function AudioAvatar({ src, image, alt }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [alt2, setAlt2] = useState(false);
  const [wobble, setWobble] = useState<"" | "a" | "b">("");
  const taps = useRef(0);
  const { pulse } = usePlasmaRuntime();

  // Los navegadores suelen bloquear el autoplay con sonido: se intenta y, si falla, queda en pausa.
  useEffect(() => {
    audio.current?.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const toggle = (e: React.MouseEvent) => {
    const a = audio.current;
    if (a) {
      if (a.paused) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      else { a.pause(); setPlaying(false); }
    }
    pulse(e.clientX, e.clientY, 1);

    taps.current += 1;
    if (taps.current === 1) { setWobble("a"); setTimeout(() => setWobble(""), 300); }
    else { setWobble("b"); setAlt2(true); setTimeout(() => { setWobble(""); setAlt2(false); taps.current = 0; }, 500); }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar saludo" : "Reproducir saludo"}
        className="relative z-[2] -mt-[50px] block cursor-pointer border-0 bg-transparent p-0"
      >
        <img
          src={image}
          alt={alt}
          width={100}
          height={100}
          className={[
            "block h-[100px] w-[100px] rounded-full border-4 border-lime bg-lime-50 object-cover shadow-[0_10px_30px_rgba(0,0,0,.35)]",
            "animate-breathe transition-[transform,filter] duration-300",
            wobble === "a" ? "scale-110 rotate-[5deg]" : "",
            wobble === "b" ? "scale-[1.15] -rotate-[5deg]" : "",
            alt2 ? "[filter:hue-rotate(180deg)]" : "",
          ].join(" ")}
        />
        <span className="absolute -right-0.5 bottom-0.5 grid h-7 w-7 place-items-center rounded-full bg-ink text-[11px] text-lime shadow-md">
          {playing ? <FaPause /> : <FaPlay />}
        </span>
      </button>
      <audio ref={audio} src={src} loop preload="none" />
    </>
  );
}
