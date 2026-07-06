const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('apply.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only" });
try {
  dom.window.eval(script);
} catch (e) {
  console.log("Error in script:", e);
}

console.log("Initial total cost:", dom.window.document.querySelector('#total-cost').textContent);

const daysInput = dom.window.document.querySelector('#days');
if (daysInput) {
    daysInput.value = 20;
    daysInput.dispatchEvent(new dom.window.Event('input'));
    console.log("After setting days=20:", dom.window.document.querySelector('#total-cost').textContent);
} else {
    console.log("daysInput not found!");
}
