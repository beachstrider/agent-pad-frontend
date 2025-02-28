import React from 'react';

export type SortOption = 'trending' | 'new' | 'finalized' | 'marketcap';

interface SortOptionsProps {
  onSort: (option: SortOption) => void;
  currentSort: SortOption;
}

const sortOptionMapping: { [key: string]: SortOption } = {
  'About to Graduate': 'trending',
  'Market Cap': 'marketcap',
  'Newly Created': 'new',
  'Graduated': 'finalized',
};

const SortOptions: React.FC<SortOptionsProps> = ({ onSort, currentSort }) => {
  return (
    <div className="grid grid-cols-4 gap-2 justify-center">
      {Object.keys(sortOptionMapping).map((option) => (
        <button
          key={option}
          onClick={() => onSort(sortOptionMapping[option])}
          className={`px-1 md:px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
            currentSort === sortOptionMapping[option]
              ? 'bg-primary text-back'
              : 'text-subtext hover:bg-[var(--card)]'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default SortOptions;