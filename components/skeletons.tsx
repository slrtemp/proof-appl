export function ProofTreeSkeleton() {
  return (
    <div aria-label="Loading Proof tree" className="relative mx-auto h-64 w-full max-w-md overflow-hidden" role="status">
      <svg aria-hidden="true" className="size-full" viewBox="0 0 400 260">
        <path d="M200 240 C198 190 204 150 200 80 M200 186 C165 155 145 130 112 118 M201 164 C235 140 258 112 291 101 M199 132 C177 106 174 83 164 63 M202 119 C225 97 228 76 242 58" fill="none" stroke="#25252a" strokeLinecap="round" strokeWidth="8" />
        {[[200,45],[164,64],[242,58],[112,118],[291,101],[150,92],[266,78],[185,100],[220,86],[135,127],[273,122],[187,127],[229,121],[166,146],[246,140]].map(([x, y], index) => (
          <circle className="skeleton" cx={x} cy={y} key={index} r="10" />
        ))}
      </svg>
      <span className="sr-only">Your Proof tree is taking shape</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <main className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-9 w-72 max-w-full rounded" />
          <div className="skeleton h-4 w-56 max-w-full rounded" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="rounded-card border border-white/[0.08] bg-surface p-4" key={index}>
              <div className="skeleton h-7 w-12 rounded" />
              <div className="skeleton mt-3 h-3 w-20 rounded" />
            </div>
          ))}
        </div>
        <section className="space-y-4 rounded-card border border-white/[0.08] bg-surface p-5">
          <div className="skeleton h-4 w-36 rounded" />
          <ProofTreeSkeleton />
        </section>
        <section className="space-y-3">
          <div className="skeleton h-5 w-36 rounded" />
          {Array.from({ length: 3 }, (_, index) => (
            <div className="flex gap-3 rounded-card border border-white/[0.08] bg-surface p-4" key={index}>
              <div className="skeleton size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-full max-w-sm rounded" />
                <div className="skeleton h-3 w-28 rounded" />
              </div>
            </div>
          ))}
        </section>
      </div>
      <aside className="space-y-4">
        <div className="rounded-card border border-white/[0.08] bg-surface p-5">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton mt-4 h-24 rounded-control" />
          <div className="skeleton mt-3 h-10 rounded-control" />
        </div>
      </aside>
    </main>
  );
}
