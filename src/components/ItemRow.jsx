import { doc, updateDoc, deleteDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

function categoryColor(cat) {
  if (!cat) return '#888';
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export default function ItemRow({ item, onEdit }) {
  async function changeQty(delta) {
    if (delta < 0 && item.quantity <= 0) return;
    await updateDoc(doc(db, 'items', item.id), {
      quantity: increment(delta),
      updatedAt: serverTimestamp(),
    });
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (confirm(`Delete "${item.name}"?`)) {
      await deleteDoc(doc(db, 'items', item.id));
    }
  }

  const depleted = item.quantity === 0;

  return (
    <div className={`item-row ${depleted ? 'item-row--depleted' : ''}`}>
      {item.category && (
        <span
          className="item-category-dot"
          style={{ background: categoryColor(item.category) }}
          title={item.category}
        />
      )}
      <div className="item-info" onClick={onEdit}>
        <span className="item-name">{item.name}</span>
        {item.category && <span className="item-category">{item.category}</span>}
      </div>
      <div className="item-controls">
        {depleted && (
          <button
            className="qty-btn qty-btn--delete"
            onClick={handleDelete}
            aria-label="Delete item"
          >
            🗑
          </button>
        )}
        <button
          className="qty-btn qty-btn--minus"
          onClick={() => changeQty(-1)}
          disabled={depleted}
          aria-label="Remove one"
        >
          −
        </button>
        <span className="item-qty">{item.quantity}</span>
        <button
          className="qty-btn qty-btn--plus"
          onClick={() => changeQty(1)}
          aria-label="Add one"
        >
          +
        </button>
      </div>
    </div>
  );
}
