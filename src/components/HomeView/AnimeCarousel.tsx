// src/components/HomeView/AnimeCarousel.tsx
import { Link } from 'react-router-dom';
import { AnimeSearchResult } from '@/lib/api/types';
import { usePlatform } from '@/hooks/usePlatform';
import { cn } from '@/lib/utils';
import MarshmallowLoader from '../common/MarshmallowLoader';

interface AnimeCarouselProps {
  title: string;
  animeList: AnimeSearchResult[] | undefined;
  isLoading: boolean;
}

const encodeAnimeId = (url: string) => encodeURIComponent(url);

export function AnimeCarousel({ title, animeList, isLoading }: AnimeCarouselProps) {
  const { isMobile } = usePlatform();

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-4 text-2xl font-bold">{title}</h2>
        <MarshmallowLoader />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div
        className={cn(
          'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
          isMobile && 'flex flex-nowrap gap-4 overflow-x-auto pb-4'
        )}
      >
        {animeList?.map((anime) => (
          <Link
            to={`/details/${encodeAnimeId(anime.url)}`}
            key={anime.url}
            className={cn(
                "group",
                isMobile && "w-3/5 flex-shrink-0 snap-start sm:w-2/5"
            )}
          >
            <div className="overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105">
              <img
                src={anime.image}
                alt={anime.title}
                className="aspect-[2/3] w-full object-cover"
                loading="lazy"
              />
            </div>
            <h3 className="mt-2 truncate font-semibold">{anime.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
