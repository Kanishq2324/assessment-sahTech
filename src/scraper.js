const STORE_DOMAIN = "https://allbirds.com"; 
const PRODUCTS_JSON_URL = `${STORE_DOMAIN}/products.json?limit=5`;

function clean(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function moneyFromVariants(variants = []) {

  // Shopify variants often contain price as string like "99.00"

  const v = variants[0];
  if (!v?.price) return "";
  return `Price: ${v.price}`;
}

export async function scrapeFiveProducts() {
  const res = await fetch(PRODUCTS_JSON_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
      Accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(
      `Shopify products.json failed: ${res.status} ${res.statusText}. Try a different Shopify store domain.`
    );
  }

  const data = await res.json();
  const list = Array.isArray(data?.products) ? data.products : [];

  const products = list.slice(0, 5).map((p, i) => {

    const name = clean(p.title);
    const shortDesc = clean(
      (p.body_html || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200)
    );

    const priceText = moneyFromVariants(p.variants);
    const description = clean(
      [shortDesc, priceText].filter(Boolean).join(" | ")
    ) || "Shopify product.";

    return {
      id: i + 1,
      name,
      description,
      sourceUrl: PRODUCTS_JSON_URL,
      productUrl: p.handle ? `${STORE_DOMAIN}/products/${p.handle}` : null,
      image: p.images?.[0]?.src || null
    };
  });

  if (products.length !== 5) {
    throw new Error(`Expected exactly 5 products, got ${products.length}.`);
  }

  return products;
}