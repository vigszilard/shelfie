export default function CategoryFilter({ categories, active, onChange }) {
  return (
    <div className="category-filter">
      <button
        className={`chip ${active === null ? 'chip--active' : ''}`}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`chip ${active === cat ? 'chip--active' : ''}`}
          onClick={() => onChange(cat === active ? null : cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
