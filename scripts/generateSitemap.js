const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const fs = require('fs');

const links = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/swap', changefreq: 'weekly', priority: 1.0 },
];

async function generateSitemap() {
    const stream = new SitemapStream({ hostname: 'https://swappy-fi.com' });
    const xmlString = await streamToPromise(Readable.from(links).pipe(stream)).then((data) => data.toString());

    fs.writeFileSync('./public/sitemap.xml', xmlString);
}

generateSitemap().catch((err) => {
    console.error('Error generating sitemap', err);
});
