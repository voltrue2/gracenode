var gn = require('../');
module.exports = gn.getRootPath().indexOf('node_modules') === -1 && __dirname.indexOf('node_modules') !== -1 ? 'node_modules/' : '';
