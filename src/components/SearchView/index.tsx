// src/components/SearchView/index.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchAnime } from '../../lib/api/anime';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import MarshmallowLoader from '../common/MarshmallowLoader';

export default function SearchView() {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ['animeSearch', searchQuery],
    queryFn: () => searchAnime(searchQuery),
    enabled: searchQuery.length > 0,
  });

  useEffect(() => {
    if (searchError) {
      toast.error(searchError.message);
    }
  }, [searchError]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(inputValue);
  };

  const encodeAnimeId = (url: string) => encodeURIComponent(url);

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          className="w-full rounded-lg border bg-card p-4 pr-12 text-card-foreground shadow-sm"
          placeholder="What do you want to watch?"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground"
          aria-label="Search"
        >
          <Search className="h-6 w-6" />
        </button>
      </form>

      {isSearching && <MarshmallowLoader />}

      {searchResults && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Search Results</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {searchResults.map((anime) => (
              <Link to={`/details/${encodeAnimeId(anime.url)}`} key={anime.url} className="group">
                <div className="overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105">
                  <img src={anime.image} alt={anime.title} className="aspect-[2/3] w-full object-cover" />
                </div>
                <h3 className="mt-2 truncate font-semibold">{anime.title}</h3>
              </Link>
            ))}
          </div>
          {searchResults.length === 0 && <p>No results found for "{searchQuery}".</p>}
        </section>
      )}
    </div>
  );
}
