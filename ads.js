const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer-core");

router.post("/", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.json({ success: false, error: "Missing query" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto(
      `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle2", timeout: 60000 }
    );

    // scroll to load more ads
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }

    const ads = await page.evaluate(() => {
      const cards = document.querySelectorAll("[data-ad-preview='1']");
      const arr = [];

      cards.forEach(card => {

        // TEXT FIELDS
        const title = card.querySelector("strong")?.innerText || null;
        const text = card.querySelector("div[dir='auto']")?.innerText || null;
        const cta = card.querySelector("a[role='button']")?.innerText || null;
        const link = card.querySelector("a[role='button']")?.href || null;

        // IMAGE CREATIVE
        const img = card.querySelector("img")?.src || null;

        // VIDEO CREATIVE — MAIN PART
        const video = card.querySelector("video")?.src 
                    || card.querySelector("video source")?.src 
                    || null;

        arr.push({
          title,
          text,
          img,
          video,
          cta,
          link
        });
      });

      return arr;
    });

    await browser.close();
    res.json({ success: true, count: ads.length, ads });

  } catch (err) {
    res.json({ success: false, error: err.toString() });
  }
});

module.exports = router;
