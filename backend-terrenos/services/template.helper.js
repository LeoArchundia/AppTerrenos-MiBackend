const replaceTemplate = (template, data) => {
  let result = template;

  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key]);
  });

  return result;
};

module.exports = { replaceTemplate };
