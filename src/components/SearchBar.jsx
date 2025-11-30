import { Search } from "lucide-react";

export default function SearchBar({ onSearch, totalMatches }) {
    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Filter files..."
                    className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all outline-none placeholder:text-muted-foreground/70"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
            {totalMatches !== undefined && (
                <div className="text-[10px] font-medium text-muted-foreground px-1 uppercase tracking-wide">
                    {totalMatches} matches found
                </div>
            )}
        </div>
    );
}
