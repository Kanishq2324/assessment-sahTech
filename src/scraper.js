import puppeteer from "puppeteer";

// We can go for multiple sites (a generic solution)
const SITES = {
  myntra: {
    buildUrl: (q) => `https://www.myntra.com/${encodeURIComponent(q)}`
  },
  ajio: {
    buildUrl: (q) => `https://www.ajio.com/search/?text=${encodeURIComponent(q)}`
  },
  puma: {
    buildUrl: (q) => `https://in.puma.com/in/en/search?q=${encodeURIComponent(q)}`
  },
  adidas: {
    buildUrl: (q) => `https://www.adidas.co.in/search?q=${encodeURIComponent(q)}`
  }
};

function clean(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function short(text, max = 200) {
  const t = clean(text);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, "") + "...";
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function extractFromDom(page) {
  return await page.evaluate(() => {

    // here the clean is redefined because the node functions aren't accessible inside evaluate
    const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();


    // This looks for all price patterns related to INR
    const priceRegex = /(₹\s?\d[\d,]*|\bINR\s?\d[\d,]*|\bRs\.?\s?\d[\d,]*)/i;


    // Common "not product" words, filtering out these words
    const badText = /(gift\s*card|track\s*orders|contact\s*us|help|login|sign\s*in|wishlist|cart|about|careers|stores|returns|shipping|privacy|terms)/i;


    // URLs that often mean "not product"
    const badHref = /(\/(login|account|wishlist|cart|help|customer|track|contact|about|privacy|terms|returns|shipping|careers)\b)/i;



    // product links are usually not tiny, not nav, and appear inside a card that contains a price
    // so we get the links in the anchors array, then apply filtering on it to fetch only
    // product links.

    const anchors = Array.from(document.querySelectorAll("a"))
      .map((a) => ({
        href: a.getAttribute("href") || "",
        text: clean(a.textContent || ""),
        el: a
      }))
      .filter((x) => x.href && x.text.length >= 10)         // avoid tiny links
      .filter((x) => !badText.test(x.text))                 // avoid nav texts
      .filter((x) => !badHref.test(x.href));                // avoid nav URLs



    const out = [];
    const seen = new Set();

    for (const a of anchors) {
      if (out.length >= 50) break;

      // Converting hrefs to Absolute URL
      let url = "";
      try {
        url = new URL(a.href, window.location.origin).toString();
      } catch {
        continue;
      }


      // Catch product links only
      // - skip homepage or category pages 
      // - skip links without path depth
      const u = new URL(url);
      const pathParts = u.pathname.split("/").filter(Boolean);
      if (pathParts.length < 2) continue;

      // Card container near the link
      const card = a.el.closest("li, article, [class*='product'], div, section") || a.el.parentElement;
      const nearText = clean(card?.innerText || "");

      // Must have a price nearby to count as product
      const priceMatch = nearText.match(priceRegex);
      if (!priceMatch) continue;

      // Remove duplicates
      if (seen.has(url)) continue;
      seen.add(url);


      // Build a final product object
      const name = a.text;
      const price = clean(priceMatch[0]);

      out.push({
        name,
        productUrl: url,
        description: nearText.slice(0, 220),
        price
      });
    }

    return out;
  });
}


// main function
export async function scrapeFiveProducts({ site = "myntra", query = "shoes" } = {}) {
  if (!SITES[site]) {
    throw new Error(`Unsupported site: ${site}. Use one of: ${Object.keys(SITES).join(", ")}`);
  }

  const sourceUrl = SITES[site].buildUrl(query);

  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36"
  );

  
  try {
    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 90000 });

    // wait for an extra 2.5 sec for dynamic data to render
    await sleep(2500);

    let raw = await extractFromDom(page);

    const products = raw
      .filter((p) => p?.name && p?.productUrl)
      .slice(0, 5)
      .map((p, i) => ({
        id: i + 1,
        name: clean(p.name),
        description: short(p.description || (p.price ? `Price: ${p.price}` : ""), 200),
        productUrl: p.productUrl,
        sourceUrl
      }));

    if (products.length !== 5) {
      throw new Error(`Expected exactly 5 products, got ${products.length}`);
    }

    return products;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}