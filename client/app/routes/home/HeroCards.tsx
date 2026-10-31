export const HeroCards = () => {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white p-2 shadow-[0_28px_80px_-42px_rgba(11,61,50,0.5)] sm:rounded-3xl sm:p-3">
        <div className="aspect-video overflow-hidden rounded-xl bg-primary/5 sm:rounded-2xl">
          <iframe
            className="size-full"
            src="https://www.youtube.com/embed/KdG4Ex6JZPo?list=PLoGvme8Qpj_214RgVUbjgMW8voKHGS8kf"
            title="YIGIL learning platform introduction"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            allowFullScreen
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 pt-4 sm:px-3 sm:pb-2">
          <div>
            <p className="text-sm font-semibold text-foreground">A closer look at learning on YIGIL</p>
            <p className="mt-1 text-xs text-muted-foreground">See how courses and practice fit together.</p>
          </div>
          <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            Watch introduction
          </span>
        </div>
      </div>
    </div>
  );
};