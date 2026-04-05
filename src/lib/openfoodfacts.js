// Try world + regional Open Food Facts endpoints
async function fetchOFF(host, barcode) {
  const res = await fetch(
    `https://${host}/api/v0/product/${barcode}.json`,
    { signal: AbortSignal.timeout(5000) }
  );
  const data = await res.json();
  if (data.status === 1 && data.product) {
    const p = data.product;
    const name =
      p.product_name ||
      p.product_name_en ||
      p.abbreviated_product_name ||
      null;
    const rawCat = p.categories_tags?.[0] ?? null;
    const category = rawCat ? rawCat.replace(/^[a-z]{2}:/, '') : null;
    if (name) return { name, category };
  }
  return null;
}

export async function lookupBarcode(barcode) {
  try {
    const result =
      (await fetchOFF('world.openfoodfacts.org', barcode)) ??
      (await fetchOFF('ro.openfoodfacts.org', barcode)) ??
      (await fetchOFF('hu.openfoodfacts.org', barcode));
    return result;
  } catch {
    return null;
  }
}
