import { BrandMark } from "@/components/brand-mark"

export function SetupNotice() {
  return (
    <section>
      <BrandMark />
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="text-sm font-medium text-violet-200">Configuración pendiente</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          Conecta la carpeta de Google Drive
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
          La web no puede listar beats porque faltan las variables de entorno.
          Créalas en{" "}
          <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[0.92em] text-zinc-200">
            .env.local
          </code>{" "}
          en la raíz del proyecto, junto a{" "}
          <code className="font-mono text-zinc-200">package.json</code>. La clave
          se queda en el servidor: no uses el prefijo{" "}
          <code className="font-mono text-zinc-200">NEXT_PUBLIC_</code>.
        </p>

        <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/8 bg-black/40 p-4 font-mono text-[13px] leading-6 break-all whitespace-pre-wrap text-zinc-200">
{`GOOGLE_API_KEY=tu_clave_de_google_cloud
GOOGLE_DRIVE_FOLDER_ID=id_de_la_carpeta_publica`}
        </pre>

        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-300">
          <li>
            En Google Cloud, activa{" "}
            <a
              className="text-violet-200 underline decoration-violet-400/40 underline-offset-2 hover:text-white"
              href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
              target="_blank"
              rel="noreferrer"
            >
              Google Drive API v3
            </a>{" "}
            y crea una API key.
          </li>
          <li>
            No restrinjas esa clave por sitios web o referente HTTP. El servidor
            no envía ese referente y Drive respondería 403. Puedes limitarla a la
            API de Drive.
          </li>
          <li>
            Comparte la carpeta como «Cualquier persona con el enlace». El ID es
            el final de{" "}
            <span className="font-mono text-zinc-400">
              drive.google.com/drive/folders/ESTE_ID
            </span>
            .
          </li>
          <li>
            Nombra cada audio{" "}
            <span className="font-mono text-zinc-200">Nombre_BPM_Key.mp3</span>,
            por ejemplo{" "}
            <span className="font-mono text-zinc-200">Cyberpunk_140_Cm.mp3</span>.
          </li>
          <li>
            Guarda el archivo y reinicia{" "}
            <code className="font-mono text-zinc-200">npm run dev</code>. Los beats
            nuevos aparecen en menos de un minuto.
          </li>
        </ol>
      </div>
    </section>
  )
}
