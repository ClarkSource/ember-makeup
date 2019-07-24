/**
 * Unescapes a CSS string.
 *
 * Unfortunately there is no standard counterpart to `CSS.escape`.
 *
 * So far it seems that `unesc` from `postcss-selector-parser` is the best
 * solution on the internet.
 *
 * @see https://github.com/postcss/postcss-selector-parser/blob/master/src/util/unesc.js
 * @see https://github.com/mathiasbynens/cssesc/issues/14
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape
 */
export { default as unescape } from 'postcss-selector-parser/dist/util/unesc';
