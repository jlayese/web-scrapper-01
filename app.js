const puppeteer = require('puppeteer');
var fs = require('fs');

var stream = fs.createWriteStream("results.txt");
const app = async () => {
  const args = [
    '--start-maximized',
    // '--no-sandbox',
    // '--disable-setuid-sandbox',
    // '--disable-infobars',
    // '--window-position=0,0',
    // '--ignore-certifcate-errors',
    // '--ignore-certifcate-errors-spki-list',
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
  ];

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'],
    // args,
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);

  await page.goto('https://infobiz.fina.hr/landing');
  await page.waitForSelector('.text-right');
  await page.click('.text-right a');

  // Login
  await page.waitForSelector('#Username');
  await page.type('#Username', 'nikola.milosevic12@hotmail.com', { delay: 100 });
  await page.type('#togglePasswordVisibility', 'Inicijalni1', { delay: 100 });
  await page.click('.btn.btn-fina-blue');

  await page.waitForSelector('.btn-primary');
  const pageClicked = await page.evaluate(() => {
    return !!document.querySelector('.btn-primary') // !! converts anything to boolean
  });

  if (pageClicked) {
    await page.click('.btn-primary');
  }

  await sleep(2000)

  const acceptAll = await page.evaluate(() => {
    return !!document.querySelector('#acceptall') // !! converts anything to boolean
  });

  console.log('[AA]', acceptAll)

  if (acceptAll) {
    await page.click('#acceptall');
  }
  // Go to contacts page
  await page.waitForSelector('#sbs-chart-container');
  await page.goto('https://infobiz.fina.hr/subject/list/0ae65efd-6c27-46c6-885e-a7da1bb45367');

  await page.waitForSelector('#DynamicReportTableDiv_table', { visible: true });

  // Gather assets page urls for all the blockchains
  const assetUrls = await page.$$eval(
    '#DynamicReportTableDiv_table > tbody > tr td:first-child a',
    assetLinks => assetLinks.map(link => link.href)
  );

  // // await page.waitForFunction()
  // console.log(assetUrls)
  const results = [];


  const urls = [];
  // Results are ready
  const getAssetUrls = async () => {
    return await page.$$eval(
      '#DynamicReportTableDiv_table > tbody > tr td:first-child a',
      assetLinks => assetLinks.map(link => link.href)
    );
  }

  const evalNext = async () => {
    // paginate_button page-item next disabled
    return await page.evaluate(() => {
      return !!document.querySelector('.paginate_button.page-item.next.disabled') // !! converts anything to boolean
    });
  }

  // delay execution. should imitage network delay here
  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
  }

  const collectData = () => {
    // content

    // naziv
    // Adresa
    // Djelatnost
    // Telefon
    // Ovlaštene osobe
    // Veličina
  }

  const init = async () => {
    // paginate_button page-item next
    await page.waitForSelector('#DynamicReportTableDiv_table', { visible: true });
    await sleep(15000)
    const tempUrls = await getAssetUrls()
    await sleep(15000)
    const btnExists = await evalNext();
    console.log('exists', btnExists);
    console.log(tempUrls)
    urls.push(urls)
    if (!btnExists) {
      await page.click('.paginate_button.page-item.next');
      return await init();
    } else {
      return;
    }
  }


  // await init();

  let counter = 0;
  // Visit each assets page one by one
  for (let assetsUrl of assetUrls) {
    if (counter > 1) continue;
    await page.goto(assetsUrl);
    console.log(assetsUrl)
    // Now collect all the ICO urls.
    // const icoUrls = await page.$$eval(
    //   '#page-wrapper > main > div.container > div > table > tbody > tr > td:nth-child(2) a',
    //   links => links.map(link => link.href)
    // );
    await page.waitForSelector('.card-body .border-bottom', { visible: true });
    await page.waitForSelector('.card-body table', { visible: true });

    // const parent = await page.evaluate(() => document.querySelector('.card-body'));
    // const tab1 = await page.evaluate(() => parent.querySelectorAll('table')[0]);
    // const tab2 = await page.evaluate(() => parent.querySelectorAll('table')[1]);
    // const tab1Child = await page.evaluate(() => tab1.querySelectorAll('tbody tr'));
    // const tab2Child = await page.evaluate(() => tab2.querySelectorAll('tbody tr'));
    // await sleep(3000);
    const telefon = await page.evaluate(() => document.querySelectorAll('.card-body table')[0].querySelector('tbody tr:nth-child(5) td').textContent.replace(/[\r\n]+/gm, '').replace('Telefon:', '').replace(/\s+/g, " ").trim());

    await sleep(2000);
    if (telefon.startsWith('09')) {
      const name = await page.evaluate(() => document.querySelector('.card-body .border-bottom').textContent.replace(/[\r\n]+/gm, '').trim().replace('Puni naziv:', '').replace(/\s+/g, " ").trim());
      const address = await page.evaluate(() => document.querySelectorAll('.card-body table')[0].querySelector('tbody tr:nth-child(1) td').textContent.replace(/[\r\n]+/gm, '').trim().replace('Subjekti na istoj adresi', '').trim().replace('Adresa:', '').replace(/\s+/g, " ").trim());
      const activity = await page.evaluate(() => document.querySelectorAll('.card-body table')[0].querySelector('tbody tr:nth-child(2) td').textContent.replace(/[\r\n]+/gm, '').trim().replace(/[\r\n]+/gm, '').trim().replace('Djelatnost:', '').replace(/\s+/g, " ").trim());
      const person = await page.evaluate(() => document.querySelectorAll('.card-body table')[0].textContent.match(new RegExp('Ovlaštene osobe\:(.*?)\\n', 'gm'))[0].replace('\n', '').replace('Ovlaštene osobe:', '').trim());
      const size = await page.evaluate(() => document.querySelectorAll('.card-body table')[1].textContent.match(new RegExp('Veličina\:(.*?)\\n', 'gm'))[0].replace('\n', '').replace('Veličina:', '').trim());


      results.push({
        name,
        telefon,
        address,
        activity,
        person,
        size
      });
    }
    await sleep(1000);

   
    console.log(telefon)

    

    counter++;
  }

  console.log(results)
};
app();