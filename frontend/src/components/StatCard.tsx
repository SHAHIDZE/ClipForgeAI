type Props = {
  title: string;
  value: string;
};

export default function StatCard({
  title,
  value,
}: Props) {
  return (
    <div
      className="
        group
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900/80
        p-5
        shadow-lg
        shadow-black/10
        transition-all
        duration-200
        hover:-translate-y-1
        hover:border-violet-500/40
        hover:bg-zinc-900
      "
    >
      <p className="text-sm font-medium text-zinc-500">
        {title}
      </p>

      <div className="mt-3 flex items-end justify-between">
        <h2
          className="
            text-3xl
            font-black
            tracking-tight
            text-white
          "
        >
          {value}
        </h2>

        <div
          className="
            h-2
            w-2
            rounded-full
            bg-violet-500
            shadow-lg
            shadow-violet-500/50
          "
        />
      </div>
    </div>
  );
}