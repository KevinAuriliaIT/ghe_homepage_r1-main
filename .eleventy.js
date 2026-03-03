const fs = require('fs');

module.exports = function(eleventyConfig) {
  // Load German translations
  const deTranslations = JSON.parse(fs.readFileSync('./public/locales/de.json', 'utf8'));
  eleventyConfig.addGlobalData('i18n_de', deTranslations);

  // i18n filter
  eleventyConfig.addFilter('i18n', (key) => {
    // Access nested keys like "contact.faq1_a"
    const keys = key.split('.');
    let value = deTranslations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return the key itself or a warning if not found
        return key; 
      }
    }
    return value;
  });

  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("public/css");
  eleventyConfig.addPassthroughCopy("public/js");
  eleventyConfig.addPassthroughCopy("public/assets");
  eleventyConfig.addPassthroughCopy("public/locales");
  eleventyConfig.addPassthroughCopy("public/data");

  return {
    dir: {
      input: "public",
      includes: "_includes",
      output: "dist"
    },
    // Use Nunjucks for HTML files
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
