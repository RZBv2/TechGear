import { useState, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";

export type SortOption =
  "relevance" | "price-asc" | "price-desc" | "rating" | "newest";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Relevance",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Highest rated",
  newest: "Newest first",
};

export function FilterBar({
  sort,
  minPrice,
  maxPrice,
  onChange,
}: {
  sort: SortOption;
  minPrice?: number;
  maxPrice?: number;
  onChange: (next: {
    sort?: SortOption;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}) {
  const [min, setMin] = useState(minPrice?.toString() ?? "");
  const [max, setMax] = useState(maxPrice?.toString() ?? "");

  const applyPrice = (event: FormEvent) => {
    event.preventDefault();
    onChange({
      minPrice: min.trim() ? Number(min) : undefined,
      maxPrice: max.trim() ? Number(max) : undefined,
    });
  };

  const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined;

  return (
    <div className="filter-bar" data-reveal>
      <div className="filter-bar__group">
        <SlidersHorizontal
          size={16}
          className="filter-bar__icon"
          aria-hidden="true"
        />
        <label className="filter-bar__field">
          <span>Sort by</span>
          <select
            value={sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as SortOption })
            }
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="filter-bar__price" onSubmit={applyPrice}>
        <label className="filter-bar__field">
          <span>Min ৳</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            placeholder="0"
          />
        </label>
        <label className="filter-bar__field">
          <span>Max ৳</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            placeholder="Any"
          />
        </label>
        <button className="btn btn--ghost" type="submit">
          Apply
        </button>
        {hasPriceFilter ? (
          <button
            className="filter-bar__clear"
            type="button"
            onClick={() => {
              setMin("");
              setMax("");
              onChange({ minPrice: undefined, maxPrice: undefined });
            }}
          >
            Clear price
          </button>
        ) : null}
      </form>
    </div>
  );
}
