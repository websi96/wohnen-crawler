const Flat = require('../flat');
const FlatChecker = require('../flatchecker');
const rp = require('request-promise');
const jsdom = require('jsdom');
const {
  JSDOM
} = jsdom;
const logErr = require('../logger').logErr;
const logOut = require('../logger').logOut;

class ebwCrawler {
  constructor() {
    this.flatChecker = new FlatChecker(true);
    this.newFlats = [];
  }

  async crawl() {
    try {
      logOut('crawlEGW');
      this.newFlats = [];

      let url = 'http://www.egw.at/immobilien/bestands-wohnungen/miete/';

      if (process.env.NODE_ENV == 'dev') {
        url = 'http://127.0.0.1:8080/egw';
      }

      let res1 = await rp({
        'url': url,
        resolveWithFullResponse: true
      })
      let document = new JSDOM(res1.body).window.document;
      let angebot = document.querySelectorAll('.immobilien')[0].querySelectorAll('tr');

      let flats = [];
      for (let i = 1; i < angebot.length; i++) {
        let district, city, link, rooms, size, costs, deposit, funds, legalform, title, status, info, docs, images;

        let [destination, ...rest] = angebot[i].querySelectorAll('a')[0].innerHTML.split(",");
        let adress = rest.join(',').trim();

        district = parseInt(destination.split(' ')[0]);
        city = destination.split(' ')[1];
        link = angebot[i].querySelectorAll('a')[0].href;
        rooms = parseInt(angebot[i].querySelectorAll('td')[2].innerHTML);
        size = angebot[i].querySelectorAll('td')[1].textContent;
        costs = angebot[i].querySelectorAll('td')[4].innerHTML.split(" ")[1];
        funds = angebot[i].querySelectorAll('td')[3].innerHTML.split(" ")[1];

        let flat = new Flat('EGW', district, city, adress, link, rooms, size, costs, deposit, funds, legalform, title, status, info, docs, images);

        flats.push(JSON.stringify(flat));
      }

      this.newFlats = await this.flatChecker.compare(flats);

    } catch (error) {
      logErr(error);
    }

    return;

  }
}

module.exports = ebwCrawler;