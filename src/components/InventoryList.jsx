import { useState, useMemo } from 'react';
import { useInventory } from '../hooks/useInventory';
import ItemRow from './ItemRow';
import CategoryFilter from './CategoryFilter';

export default function InventoryList({ onAdd, onEdit, onScan }) {
  const { items, loading } = useInventory();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory) list = list.filter((i) => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, activeCategory, search]);

  const needed = filtered.filter((i) => i.quantity === 0);
  const inStock = filtered.filter((i) => i.quantity > 0);

  return (
    <div className="inventory">
      <header className="top-bar">
        <h1 className="app-title">StockWatcher</h1>
        <div className="top-bar-actions">
          <button className="icon-btn" onClick={() => setShowSearch((s) => !s)} aria-label="Search">
            🔍
          </button>
          <button className="icon-btn" onClick={onScan} aria-label="Scan barcode">
            📷
          </button>
        </div>
      </header>

      {showSearch && (
        <div className="search-bar">
          <input
            autoFocus
            type="search"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      <div className="item-list">
        {loading && <p className="list-empty">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <p className="list-empty">
            {items.length === 0 ? 'No items yet. Tap + to add one.' : 'No items match.'}
          </p>
        )}

        {needed.length > 0 && (
          <>
            <div className="section-header">Need to buy</div>
            {needed.map((item) => (
              <ItemRow key={item.id} item={item} onEdit={() => onEdit(item)} />
            ))}
          </>
        )}

        {inStock.length > 0 && (
          <>
            {needed.length > 0 && <div className="section-header">In stock</div>}
            {inStock.map((item) => (
              <ItemRow key={item.id} item={item} onEdit={() => onEdit(item)} />
            ))}
          </>
        )}
      </div>

      <button className="fab" onClick={onAdd} aria-label="Add item">
        +
      </button>
    </div>
  );
}
