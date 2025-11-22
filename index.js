import express from "express";
import puppeteer from "puppeteer-core";

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const title = await page.title();
    
    await browser.close();

    res.json({ success: true, title });
  } catch (e) {
    res.json({ success: false, error: e.toString() });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
