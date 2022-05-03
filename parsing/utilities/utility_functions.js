function cleanText(text) {
  return text
    .replace(/\\[n|r]/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/(&nbsp;|<([^>]+)>)/gi, ' ');
}

function cramText(text) {
  return text.replace(/\W/g, '').toLowerCase();
}

function linebreakText(text) {
  return text.replace(/\s{2,}/g, '<br>');
}

function fullCleanText(text) {
  return [cleanText(text), cramText(cleanText(text)), linebreakText(cleanText(text)), linebreakText(cleanText(text)).split('<br>')];
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function camelToTitle(text) {
  const result = text.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}
export { cleanText, cramText, linebreakText, fullCleanText, capitalizeFirstLetter, toTitleCase, camelToTitle };
