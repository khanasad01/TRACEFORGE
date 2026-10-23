const http = require('http');

http.get('http://localhost:5173/', (res) => {
  console.log('HTTP_STATUS:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTML_LENGTH:', data.length);
    console.log('CONTAINS_ROOT:', data.includes('<div id="root"></div>'));
  });
}).on('error', (err) => {
  console.error('HTTP_ERROR:', err.message);
});
