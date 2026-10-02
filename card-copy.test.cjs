const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const page = fs.readFileSync('index.html', 'utf8');
const code = page.slice(page.indexOf('function kartaQuti(){'), page.indexOf('// Ustoz taklifi:'));

function card(clipboard, legacyCopy = () => false) {
  const label = { textContent: 'Nusxa' };
  const button = {
    dataset: { nusxa: '9860010106200552' },
    querySelector: () => label,
  };
  const document = {
    querySelectorAll: () => [button],
    createElement: () => ({
      value: '', style: {}, setAttribute() {}, select() {}, remove() {},
    }),
    body: { appendChild() {} },
    execCommand: legacyCopy,
  };
  const context = { TOLOV_KARTA: { raqam: button.dataset.nusxa, egasi: 'Orinova Alfiya' },
    esc: (x) => x, document, navigator: { clipboard } };
  vm.runInNewContext(`${code}\nthis.render = kartaQuti; this.bind = kartaNusxa;`, context);
  context.bind();
  return { html: context.render(), button, label };
}

test('payment card shows the supplied details and copies digits', async () => {
  let copied;
  const view = card({ writeText: async (value) => { copied = value; } });
  assert.match(view.html, /9860 0101 0620 0552/);
  assert.match(view.html, /Orinova Alfiya/);
  await view.button.onclick();
  assert.equal(copied, '9860010106200552');
  assert.equal(view.label.textContent, 'Copied ✓');
});

test('blocked clipboard API falls back to WebView copy command', async () => {
  const view = card({ writeText: async () => { throw new Error('blocked'); } }, () => true);
  await view.button.onclick();
  assert.equal(view.label.textContent, 'Copied ✓');
});
