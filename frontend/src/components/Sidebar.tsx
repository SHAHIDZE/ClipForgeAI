import {
Home,
Folder,
History,
Settings,
Sparkles
} from "lucide-react";

export default function Sidebar() {
return (
<div className="w-64 h-screen border-r border-zinc-800 p-6">

<div className="space-y-6">

<button className="flex gap-3">
<Home size={20}/>
Dashboard
</button>

<button className="flex gap-3">
<Folder size={20}/>
Projects
</button>

<button className="flex gap-3">
<History size={20}/>
History
</button>

<button className="flex gap-3">
<Sparkles size={20}/>
AI Studio
</button>

<button className="flex gap-3">
<Settings size={20}/>
Settings
</button>

</div>

</div>
);
}