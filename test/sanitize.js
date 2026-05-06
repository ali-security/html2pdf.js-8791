import { createElement } from '../src/utils.js';

// Mirrors test/util/test-harness.js TEXT_SOURCE from upstream PR #877:
// a safe span, an <img onerror=...>, and a <script> that all try to
// rewrite #target. After sanitization, only the safe span should remain.
var TEXT_SOURCE = [
  '<span id="target">Safe</span> text',
  '<img src=x onerror="document.querySelector(\'#target\').innerHTML = \'Onerror\'">',
  '<script>document.querySelector(\'#target\').innerHTML = \'Script\'</script>',
].join('\n');

describe('sanitize', function () {
  describe('createElement', function () {
    var el;

    before(function () {
      el = createElement('div', { innerHTML: TEXT_SOURCE });
    });

    it('should keep safe content intact', function () {
      var target = el.querySelector('#target');
      expect(target).to.exist;
      expect(target.textContent).to.equal('Safe');
    });

    it('should strip <script> tags', function () {
      expect(el.getElementsByTagName('script').length).to.equal(0);
      expect(el.innerHTML).to.not.include('<script');
    });

    it('should strip event-handler attributes (e.g. onerror)', function () {
      var img = el.querySelector('img');
      if (img) {
        expect(img.hasAttribute('onerror')).to.equal(false);
      }
      expect(el.innerHTML.toLowerCase()).to.not.include('onerror');
    });
  });

  describe('html2pdf().from(string)', function () {
    // worker.from() with a string source funnels through createElement(),
    // so the same sanitization should apply to PDF input.
    it('should sanitize string sources before rendering', function () {
      return html2pdf().from(TEXT_SOURCE).get('src').then(function (src) {
        expect(src).to.exist;
        expect(src.getElementsByTagName('script').length).to.equal(0);
        expect(src.innerHTML.toLowerCase()).to.not.include('onerror');
        var target = src.querySelector('#target');
        expect(target).to.exist;
        expect(target.textContent).to.equal('Safe');
      });
    });
  });
});
