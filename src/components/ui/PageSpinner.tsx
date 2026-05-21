interface PageSpinnerProps {
  message?: string;
}

export default function PageSpinner({ message = 'Loading Beplanned...' }: PageSpinnerProps) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="bp-scanline flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10" aria-hidden>
          <span className="bp-command text-lg font-black text-cyan-200">B</span>
        </div>
        <p className="bp-command text-xs uppercase tracking-[0.24em] text-slate-500">{message}</p>
      </div>
    </div>
  );
}
