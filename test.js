jQuery('#DynamicReportTableDiv_table > tbody > tr td:first-child a').each(function () {
  const test = jQuery(this);
  console.log(test.attr('href'))
})