import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';

type FilterOptionType = {
  value: string;
  label: string;
};

type FilterType = {
  id: string;
  label: string;
  options: FilterOptionType[];
};

type SearchFilterProps = {
  filters: FilterType[];
  onFilter: (selectedFilters: { [key: string]: boolean }) => void;
};

const SearchFilter = ({ filters, onFilter }: SearchFilterProps) => {
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: boolean }>({});
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterChange = (value: string) => {
    const newFilters = {
      ...selectedFilters,
      [value]: !selectedFilters[value],
    };

    if (!newFilters[value]) {
      delete newFilters[value];
    }

    setSelectedFilters(newFilters);
    onFilter(newFilters);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFilter({});
  };

  const filteredFilters = filters.map(filter => ({
    ...filter,
    options: filter.options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }));

  if (filters.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        フィルターがありません
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="フィルター検索"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedFilters && Object.keys(selectedFilters).length > 0 && (
        <button
          onClick={clearAllFilters}
          className="mb-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <FiX className="mr-1" />
          すべてクリア
        </button>
      )}

      {filteredFilters.map((filter) => (
        <div key={filter.id} className="mb-4">
          <button
            onClick={() => toggleGroup(filter.id)}
            className="flex items-center justify-between w-full p-2 text-left font-medium hover:bg-gray-50 rounded"
            aria-label={expandedGroups[filter.id] ? "折りたたむ" : "展開する"}
          >
            {filter.label}
            {expandedGroups[filter.id] ? <FiChevronUp /> : <FiChevronDown />}
          </button>

          <div className={`mt-2 space-y-2 ${expandedGroups[filter.id] ? '' : 'hidden'}`}>
            {filter.options.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedFilters[option.value]}
                  onChange={() => handleFilterChange(option.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchFilter;