import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
await page.goto("http://localhost:5173/programs", { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("section h2", { timeout: 20000 });

const info = await page.evaluate(() => {
  const sections = [...document.querySelectorAll("main section")];
  return sections.map((s) => ({
    title: s.querySelector("h2")?.textContent,
    count: s.querySelector("span")?.textContent,
  }));
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "/tmp/programs_rubric2.png", fullPage: false });
await browser.close();
