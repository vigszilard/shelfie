export async function lookupBarcode(barcode) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const name =
        p.product_name_en ||
        p.product_name ||
        p.abbreviated_product_name ||
        null;
      const rawCat = p.categories_tags?.[0] ?? null;
      const category = rawCat ? rawCat.replace(/^[a-z]{2}:/, '') : null;
      return { name, category };
    }
  } catch {
    // timeout, network error, or parse error — fall through to manual entry
  }
  return null;
}
