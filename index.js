const { chromium } = require('playwright');

async function validateHackerNewsOrdering() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Starting validation of Hacker News article ordering...');
    
    
    await page.goto('https://news.ycombinator.com/newest');
    
    let articles = [];
    let currentPage = 1;
    
    while (articles.length < 100) {
      const pageArticles = await page.evaluate(() => {
        const articleNodes = document.querySelectorAll('tr.athing');
        const articles = [];
        articleNodes.forEach(node => {
          const ageElement = node.nextElementSibling.querySelector('.age a');
          const timestamp = ageElement ? new Date(ageElement.title).getTime() : 0;
          
          articles.push({
            id: node.getAttribute('id'),
            timestamp: timestamp,
            timeString: ageElement ? ageElement.title : 'unknown'
          });
        });
        
        return articles;
      });
      
      articles = articles.concat(pageArticles);
      
      // If we don't have 100 articles yet, go to next page
      if (articles.length < 100) {
        currentPage++;
        const moreLink = await page.locator('.morelink').click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Trim to exactly 100 articles
    articles = articles.slice(0, 100);
    
    let isOrdered = true;
    let firstError = null;
    
    for (let i = 1; i < articles.length; i++) {
      if (articles[i].timestamp > articles[i-1].timestamp) {
        isOrdered = false;
        firstError = {
          position: i,
          newer: articles[i],
          older: articles[i-1]
        };
        break;
      }
    }
    
    // Output results
    if (isOrdered) {
      console.log('SUCCESS: All 100 articles are correctly ordered from newest to oldest.');
    } else {
      console.log('ERROR: Articles are not correctly ordered.');
      console.log('First ordering error found at position', firstError.position + 1);
      console.log('Article ordering error:');
      console.log(`Position ${firstError.position}: ${firstError.older.timeString}`);
      console.log(`Position ${firstError.position + 1}: ${firstError.newer.timeString}`);
    }
    
    if (articles.length !== 100) {
      console.log(`WARNING: Expected 100 articles but found ${articles.length}`);
    }
    
  } catch (error) {
    console.error('An error occurred during validation:', error);
    
  } finally {
    await browser.close();
  }
}

validateHackerNewsOrdering().catch(console.error);

//-----------------Thankyou -----------------//