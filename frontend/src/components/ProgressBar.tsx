type Props = {
  progress: number;
};

export default function ProgressBar({ progress }: Props) {
  return (
    <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
      <div
        className="h-full bg-violet-600 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}