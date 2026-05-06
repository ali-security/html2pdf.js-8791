import { createElement } from '../src/utils.js';

// Mirrors test/util/test-harness.js TEXT_SOURCE from upstream PR #877:
// a safe span, an <img onerror=...>, and a <script> that all try to
// rewrite the safe span. After sanitization, only the span should remain.
//
// NOTE: the upstream patch uses id="target", but DOMPurify's default
// SANITIZE_DOM strips id/name attributes whose value collides with a
// property of `document` or `HTMLFormElement` (`target` is a form prop),
// so we use a non-colliding id here to keep the assertions meaningful.
var TEXT_SOURCE = [
  '<span id="xss-marker">Safe</span> text',
  '<img src=x onerror="document.querySelector(\'#xss-marker\').innerHTML = \'Onerror\'">',
  '<script>document.querySelector(\'#xss-marker\').innerHTML = \'Script\'</script>',
].join('\n');

function assertSanitized(el) {
  expect(el).to.exist;

  // Safe content survives.
  var span = el.querySelector('span');
  expect(span, 'safe <span> should be preserved').to.exist;
  expect(span.textContent).to.equal('Safe');
  expect(el.textContent).to.include('text');

  // Dangerous content is stripped.
  expect(el.getElementsByTagName('script').length, '<script> tags').to.equal(0);
  expect(el.innerHTML).to.not.include('<script');
  expect(el.innerHTML.toLowerCase()).to.not.include('onerror');

  var img = el.querySelector('img');
  if (img) {
    expect(img.hasAttribute('onerror'), 'onerror handler').to.equal(false);
  }
}

describe('sanitize', function () {
  describe('createElement', function () {
    it('should sanitize innerHTML when constructing an element', function () {
      var el = createElement('div', { innerHTML: TEXT_SOURCE });
      assertSanitized(el);
    });
  });

  describe('html2pdf().from(string)', function () {
    // worker.from() with a string source funnels through createElement(),
    // so the same sanitization should apply to PDF input.
    it('should sanitize string sources before rendering', function () {
      return html2pdf().from(TEXT_SOURCE).get('src').then(function (src) {
        assertSanitized(src);
      });
    });
  });
});
