const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer-core");

router.post("/", async (req, res) => {
  try {
    const query = req.body.query;
    if (!query) return res.json({ error: "query required" });

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(
      `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle2" }
    );

    // scroll
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
    }

    const ads = await page.evaluate(() => {
      return [...document.querySelectorAll("[data-ad-preview='1']")].map(card => ({
        title: card.querySelector("strong")?.innerText || null,
        text: card.querySelector("div[dir='auto']")?.innerText || null,
        img: card.querySelector("img")?.src || null,
        cta: card.querySelector("a[role='button']")?.innerText || null,
        link: card.querySelector("a[role='button']")?.href || null
      }));
    });

    await browser.close();

    res.json({ success: true, count: ads.length, ads });

  } catch (e) {
    res.json({ success: false, error: e.toString() });
  }
});

module.exports = router;
